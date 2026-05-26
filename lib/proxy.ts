import "server-only";

import { NextResponse } from "next/server";

export async function proxy(
  url: string,
  init: RequestInit,
  apiKey: string,
): Promise<NextResponse> {
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {}),
        "X-Admin-Api-Key": apiKey,
      },
      cache: "no-store",
    });
  } catch (err) {
    return NextResponse.json(
      {
        detail: `Upstream fetch failed: ${err instanceof Error ? err.message : "unknown error"}`,
      },
      { status: 502 },
    );
  }

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}
