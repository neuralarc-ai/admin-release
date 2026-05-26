import { NextResponse } from "next/server";
import { readBackendConfig } from "@/lib/serverConfig";
import { proxy } from "@/lib/proxy";

const BACKEND_PATH = "/v2/admin/release-popups";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cfg = readBackendConfig();
  if (!cfg.ok) return missingConfig(cfg.missing);

  const incoming = new URL(req.url);
  const url = `${cfg.config.baseUrl}${BACKEND_PATH}${incoming.search}`;
  return proxy(url, { method: "GET" }, cfg.config.apiKey);
}

export async function POST(req: Request) {
  const cfg = readBackendConfig();
  if (!cfg.ok) return missingConfig(cfg.missing);

  const body = await req.text();
  return proxy(
    `${cfg.config.baseUrl}${BACKEND_PATH}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
    cfg.config.apiKey,
  );
}

function missingConfig(missing: string[]) {
  return NextResponse.json(
    {
      detail: `Admin app is not configured. Missing env var(s): ${missing.join(", ")}. See .env.example.`,
    },
    { status: 503 },
  );
}
