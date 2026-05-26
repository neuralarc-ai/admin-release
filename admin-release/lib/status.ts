import type { ReleasePopup, Status } from "./types";

export function computeStatus(
  row: Pick<ReleasePopup, "is_active" | "start_at" | "end_at">,
  now: Date = new Date(),
): Status {
  if (!row.is_active) return "disabled";
  const start = new Date(row.start_at);
  const end = new Date(row.end_at);
  if (now >= end) return "expired";
  if (now < start) return "scheduled";
  return "live";
}
