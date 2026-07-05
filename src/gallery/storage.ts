import type { GalleryItem } from "../types";

const KEY = "mirror-gallery";
const MAX_ITEMS = 24;

export function loadGallery(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GalleryItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Persists a capture. Everything stays in localStorage — no image ever
 * leaves the browser. Oldest items are dropped first when the quota or the
 * item cap is hit.
 */
export function saveToGallery(thumb: string): GalleryItem[] {
  const items = loadGallery();
  items.unshift({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    thumb,
  });
  let trimmed = items.slice(0, MAX_ITEMS);
  while (trimmed.length > 0) {
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed));
      break;
    } catch {
      trimmed = trimmed.slice(0, trimmed.length - 1);
    }
  }
  return trimmed;
}

export function deleteFromGallery(id: string): GalleryItem[] {
  const items = loadGallery().filter((i) => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(items));
  return items;
}
