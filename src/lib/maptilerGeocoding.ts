import type { Locale } from "@/lib/i18n";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

export function isMapTilerGeocodingAvailable(): boolean {
  return MAPTILER_KEY.length > 0;
}

export interface ForwardGeocodeHit {
  placeName: string;
  lng: number;
  lat: number;
}

interface MapTilerGeocodeFeature {
  geometry?: { type: string; coordinates?: [number, number] };
  place_name?: string;
}

interface MapTilerGeocodeResponse {
  features?: MapTilerGeocodeFeature[];
}

/** Exported for unit tests (GeoJSON parsing). */
export function hitsFromMapTilerGeocodeJson(json: MapTilerGeocodeResponse): ForwardGeocodeHit[] {
  const features = json.features ?? [];
  const hits: ForwardGeocodeHit[] = [];
  for (const f of features) {
    const coords = f.geometry?.coordinates;
    const placeName = f.place_name?.trim();
    if (!coords || coords.length < 2 || !placeName) continue;
    const [lng, lat] = coords;
    hits.push({ placeName, lng, lat });
  }
  return hits;
}

/**
 * Forward geocoding (address search). One HTTPS request per call — counts toward
 * MapTiler Cloud "Search & Geocoding" quota (same as reverse geocoding).
 */
export async function forwardGeocode(
  query: string,
  options?: { limit?: number; language?: Locale },
): Promise<ForwardGeocodeHit[]> {
  const q = query.trim();
  if (!MAPTILER_KEY || q.length < 2) return [];

  const limit = Math.min(Math.max(options?.limit ?? 8, 1), 10);
  const lang = options?.language ?? "en";

  const path = encodeURIComponent(q);
  const params = new URLSearchParams({
    key: MAPTILER_KEY,
    limit: String(limit),
    autocomplete: "true",
    language: lang,
  });

  const res = await fetch(`https://api.maptiler.com/geocoding/${path}.json?${params}`);
  if (!res.ok) return [];

  const json = (await res.json()) as MapTilerGeocodeResponse;
  return hitsFromMapTilerGeocodeJson(json);
}
