import { NextResponse } from "next/server";
import { readBackendConfig } from "@/lib/serverConfig";
import { proxy } from "@/lib/proxy";

const BACKEND_PATH = "/v2/admin/release-popups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const cfg = readBackendConfig();
  if (!cfg.ok) return missingConfig(cfg.missing);
  return proxy(
    `${cfg.config.baseUrl}${BACKEND_PATH}/${encodeURIComponent(id)}`,
    { method: "GET" },
    cfg.config.apiKey,
  );
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const cfg = readBackendConfig();
  if (!cfg.ok) return missingConfig(cfg.missing);
  const body = await req.text();
  return proxy(
    `${cfg.config.baseUrl}${BACKEND_PATH}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    },
    cfg.config.apiKey,
  );
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const cfg = readBackendConfig();
  if (!cfg.ok) return missingConfig(cfg.missing);
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";
  const backendUrl = `${cfg.config.baseUrl}${BACKEND_PATH}/${encodeURIComponent(id)}${permanent ? "?permanent=true" : ""}`;
  return proxy(backendUrl, { method: "DELETE" }, cfg.config.apiKey);
}

function missingConfig(missing: string[]) {
  return NextResponse.json(
    {
      detail: `Admin app is not configured. Missing env var(s): ${missing.join(", ")}. See .env.example.`,
    },
    { status: 503 },
  );
}
