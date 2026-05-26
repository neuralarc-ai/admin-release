import "server-only";

export interface BackendConfig {
  baseUrl: string;
  apiKey: string;
  envLabel: "local" | "staging" | "production" | "unknown";
}

export type BackendConfigResult =
  | { ok: true; config: BackendConfig }
  | { ok: false; missing: ("BACKEND_BASE_URL" | "ADMIN_API_KEY")[] };

function classify(url: string): BackendConfig["envLabel"] {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return "local";
    }
    if (host.startsWith("staging") || host.includes("staging.")) return "staging";
    if (host === "api.he2.ai") return "production";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function readBackendConfig(): BackendConfigResult {
  const missing: ("BACKEND_BASE_URL" | "ADMIN_API_KEY")[] = [];
  const baseUrl = (process.env.BACKEND_BASE_URL ?? "").trim();
  const apiKey = (process.env.ADMIN_API_KEY ?? "").trim();
  if (!baseUrl) missing.push("BACKEND_BASE_URL");
  if (!apiKey) missing.push("ADMIN_API_KEY");
  if (missing.length > 0) return { ok: false, missing };
  return {
    ok: true,
    config: {
      baseUrl: baseUrl.replace(/\/$/, ""),
      apiKey,
      envLabel: classify(baseUrl),
    },
  };
}
