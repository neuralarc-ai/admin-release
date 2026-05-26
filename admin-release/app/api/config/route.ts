import { NextResponse } from "next/server";
import { readBackendConfig } from "@/lib/serverConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = readBackendConfig();
  if (!cfg.ok) {
    return NextResponse.json(
      { configured: false, missing: cfg.missing, envLabel: "unknown" },
      { status: 200 },
    );
  }
  return NextResponse.json({
    configured: true,
    envLabel: cfg.config.envLabel,
  });
}
