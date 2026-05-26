import type { ImagePosition } from "./types";

const KEY = "release-popups:image-positions:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadMap(): Record<string, ImagePosition> {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, ImagePosition>): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

export function getImagePosition(id: string): ImagePosition {
  return loadMap()[id] ?? "top";
}

export function getImagePositionMap(): Record<string, ImagePosition> {
  return loadMap();
}

export function setImagePosition(id: string, position: ImagePosition): void {
  const map = loadMap();
  if (map[id] === position) return;
  map[id] = position;
  saveMap(map);
}

export function removeImagePosition(id: string): void {
  const map = loadMap();
  if (!(id in map)) return;
  delete map[id];
  saveMap(map);
}
