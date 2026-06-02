export type Audience = "all" | "free" | "paid" | "specific";

export type Badge =
  | "announcement"
  | "update"
  | "whats_new"
  | "feature"
  | "release"
  | "improvement"
  | "maintenance"
  | "notice"
  | "alert"
  | "important"
  | "offer";

export const BADGE_OPTIONS: { value: Badge; label: string }[] = [
  { value: "announcement", label: "Announcement" },
  { value: "update",       label: "Update" },
  { value: "whats_new",    label: "What's New" },
  { value: "feature",      label: "Feature" },
  { value: "release",      label: "Release" },
  { value: "improvement",  label: "Improvement" },
  { value: "maintenance",  label: "Maintenance" },
  { value: "notice",       label: "Notice" },
  { value: "alert",        label: "Alert" },
  { value: "important",    label: "Important" },
  { value: "offer",        label: "Offer" },
];

export type PlanTier = "starter" | "pro" | "pro_creative" | "max";

export const PLAN_TIERS: PlanTier[] = ["starter", "pro", "pro_creative", "max"];

export const AUDIENCE_OPTIONS: Audience[] = ["all", "free", "paid", "specific"];

export type Status = "scheduled" | "live" | "expired" | "disabled";

export type ImagePosition = "top" | "left" | "right";

export const IMAGE_POSITIONS: ImagePosition[] = ["top", "left", "right"];

export interface ReleasePopupCreate {
  title: string;
  body: string;
  image_url: string | null;
  image_position: ImagePosition;
  badge: Badge | null;
  cta_label: string | null;
  cta_url: string | null;
  audience: Audience;
  plan_tiers: PlanTier[];
  start_at: string;
  end_at: string;
  is_active: boolean;
  priority: number;
}

export type ReleasePopupUpdate = Partial<ReleasePopupCreate>;

export interface ReleasePopup extends ReleasePopupCreate {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
  status: Status;
}

export interface ListParams {
  is_active?: boolean;
  active_now?: boolean;
  audience?: Audience;
  limit?: number;
  offset?: number;
}

export interface ListResponse {
  items: ReleasePopup[];
  total: number;
}
