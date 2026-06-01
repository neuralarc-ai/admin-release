import type {
  ImagePosition,
  ListParams,
  ListResponse,
  ReleasePopup,
  ReleasePopupCreate,
  ReleasePopupUpdate,
} from "./types";
import { IMAGE_POSITIONS } from "./types";
import { ApiError, readErrorDetail } from "./apiErrors";
import {
  getImagePosition,
  removeImagePosition,
  setImagePosition,
} from "./imagePositionStore";

const PROXY_BASE = "/api/popups";

function buildQuery(params: ListParams): string {
  const usp = new URLSearchParams();
  if (typeof params.is_active === "boolean")
    usp.set("is_active", params.is_active ? "true" : "false");
  if (params.active_now) usp.set("active_now", "true");
  if (params.audience) usp.set("audience", params.audience);
  if (typeof params.limit === "number") usp.set("limit", String(params.limit));
  if (typeof params.offset === "number") usp.set("offset", String(params.offset));
  const s = usp.toString();
  return s ? `?${s}` : "";
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const { detail, payload } = await readErrorDetail(res);
    throw new ApiError(res.status, detail, payload);
  }
  return (await res.json()) as T;
}

function isValidPosition(value: unknown): value is ImagePosition {
  return (
    typeof value === "string" &&
    (IMAGE_POSITIONS as readonly string[]).includes(value)
  );
}

function hydrateImagePosition(row: ReleasePopup): ReleasePopup {
  if (isValidPosition(row.image_position)) {
    return row;
  }
  return { ...row, image_position: getImagePosition(row.id) };
}

export async function list(params: ListParams = {}): Promise<ListResponse> {
  const res = await request<ListResponse>(`${PROXY_BASE}${buildQuery(params)}`);
  return {
    total: res.total,
    items: res.items.map(hydrateImagePosition),
  };
}

export async function get(id: string): Promise<ReleasePopup> {
  const row = await request<ReleasePopup>(`${PROXY_BASE}/${encodeURIComponent(id)}`);
  return hydrateImagePosition(row);
}

export async function create(payload: ReleasePopupCreate): Promise<ReleasePopup> {
  const row = await request<ReleasePopup>(PROXY_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setImagePosition(row.id, payload.image_position);
  return hydrateImagePosition(row);
}

export async function update(
  id: string,
  patch: ReleasePopupUpdate,
): Promise<ReleasePopup> {
  const row = await request<ReleasePopup>(`${PROXY_BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (patch.image_position) setImagePosition(id, patch.image_position);
  return hydrateImagePosition(row);
}

export async function softDelete(id: string): Promise<ReleasePopup> {
  const row = await request<ReleasePopup>(`${PROXY_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return hydrateImagePosition(row);
}

export async function hardDelete(id: string): Promise<void> {
  await request<void>(`${PROXY_BASE}/${encodeURIComponent(id)}?permanent=true`, {
    method: "DELETE",
  });
  removeImagePosition(id);
}

export function forgetImagePosition(id: string): void {
  removeImagePosition(id);
}
