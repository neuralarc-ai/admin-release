export type Audience = "all" | "free" | "paid" | "specific";

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
