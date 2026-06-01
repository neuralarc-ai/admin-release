import { NextRequest, NextResponse } from "next/server";
import { readBackendConfig } from "@/lib/serverConfig";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cfg = readBackendConfig();
  if (!cfg.ok) {
    return NextResponse.json(
      {
        detail: `Admin app is not configured. Missing env var(s): ${cfg.missing.join(", ")}. See .env.example.`,
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ detail: "Invalid multipart form data." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${cfg.config.baseUrl}/v2/admin/release-popups/upload-image`,
      {
        method: "POST",
        headers: { "X-Admin-Api-Key": cfg.config.apiKey },
        body: formData,
      },
    );
  } catch (err) {
    return NextResponse.json(
      { detail: `Upstream fetch failed: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 502 },
    );
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export async function DELETE(req: NextRequest) {
  const cfg = readBackendConfig();
  if (!cfg.ok) {
    return NextResponse.json(
      { detail: "Admin app is not configured." },
      { status: 503 },
    );
  }

  const imageUrl = new URL(req.url).searchParams.get("url");
  if (!imageUrl) {
    return NextResponse.json({ detail: "url query param required" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${cfg.config.baseUrl}/v2/admin/release-popups/upload-image?url=${encodeURIComponent(imageUrl)}`,
      { method: "DELETE", headers: { "X-Admin-Api-Key": cfg.config.apiKey } },
    );
  } catch (err) {
    return NextResponse.json(
      { detail: `Upstream fetch failed: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 502 },
    );
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
