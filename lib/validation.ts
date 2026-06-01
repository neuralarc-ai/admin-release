import type { ReleasePopupCreate, PlanTier } from "./types";
import { PLAN_TIERS } from "./types";

export type FieldErrors = Partial<Record<keyof ReleasePopupCreate, string>>;

export interface ValidationResult {
  ok: boolean;
  fieldErrors: FieldErrors;
  formError: string | null;
}

const URL_PATTERN = /^https?:\/\/.+/i;

function isUrl(value: string): boolean {
  if (!URL_PATTERN.test(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function validatePopup(input: ReleasePopupCreate): ValidationResult {
  const fieldErrors: FieldErrors = {};

  // title
  const title = input.title?.trim() ?? "";
  if (!title) fieldErrors.title = "Title is required.";
  else if (title.length > 200) fieldErrors.title = "Max 200 characters.";

  // body
  const body = input.body ?? "";
  if (!body.trim()) fieldErrors.body = "Body is required.";
  else if (body.length > 5000) fieldErrors.body = "Max 5000 characters.";

  // image_url
  if (input.image_url) {
    if (!isUrl(input.image_url))
      fieldErrors.image_url = "Must be a valid http(s) URL.";
  }

  // CTA pair
  const hasLabel = !!input.cta_label && input.cta_label.trim().length > 0;
  const hasUrl = !!input.cta_url && input.cta_url.trim().length > 0;
  if (hasLabel !== hasUrl) {
    if (!hasLabel) fieldErrors.cta_label = "Set a label or clear the CTA URL.";
    if (!hasUrl) fieldErrors.cta_url = "Set a URL or clear the CTA label.";
  } else if (hasLabel && hasUrl) {
    if ((input.cta_label ?? "").length > 50)
      fieldErrors.cta_label = "Max 50 characters.";
    if ((input.cta_url ?? "").length > 2048)
      fieldErrors.cta_url = "Max 2048 characters.";
    else if (!isUrl(input.cta_url ?? ""))
      fieldErrors.cta_url = "Must be a valid http(s) URL.";
  }

  // audience / plan_tiers
  if (input.audience === "specific") {
    const tiers = input.plan_tiers ?? [];
    if (tiers.length === 0)
      fieldErrors.plan_tiers = "Pick at least one plan tier.";
    else {
      const invalid = tiers.find((t) => !PLAN_TIERS.includes(t as PlanTier));
      if (invalid) fieldErrors.plan_tiers = `Unknown tier: ${invalid}`;
    }
  }

  // window
  if (!input.start_at) fieldErrors.start_at = "Start is required.";
  if (!input.end_at) fieldErrors.end_at = "End is required.";
  if (input.start_at && input.end_at) {
    const start = new Date(input.start_at).getTime();
    const end = new Date(input.end_at).getTime();
    if (Number.isNaN(start)) fieldErrors.start_at = "Invalid date.";
    if (Number.isNaN(end)) fieldErrors.end_at = "Invalid date.";
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      fieldErrors.end_at = "End must be after start.";
    }
  }

  // priority
  if (!Number.isInteger(input.priority))
    fieldErrors.priority = "Priority must be an integer.";

  const ok = Object.keys(fieldErrors).length === 0;
  return { ok, fieldErrors, formError: ok ? null : null };
}
