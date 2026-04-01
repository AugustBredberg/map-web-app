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

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  const normalized = normalizeForMatch(value);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

function scoreHit(query: string, placeName: string): number {
  const qNorm = normalizeForMatch(query);
  const pNorm = normalizeForMatch(placeName);
  if (!qNorm || !pNorm) return 0;

  let score = 0;
  if (pNorm === qNorm) score += 300;
  if (pNorm.startsWith(qNorm)) score += 120;
  if (pNorm.includes(qNorm)) score += 80;

  const qTokens = tokenize(query);
  const pTokens = tokenize(placeName);
  const pTokenSet = new Set(pTokens);
  const allTokensMatch = qTokens.length > 0 && qTokens.every((token) => pNorm.includes(token));
  const matchedTokenCount = qTokens.reduce(
    (count, token) => count + (pTokenSet.has(token) || pNorm.includes(token) ? 1 : 0),
    0,
  );

  score += matchedTokenCount * 25;
  if (allTokensMatch) score += 100;
  if (qTokens.some((t) => /\d/.test(t))) {
    const numericTokenMatches = qTokens.filter((t) => /\d/.test(t) && pNorm.includes(t)).length;
    score += numericTokenMatches * 40;
  }
  return score;
}

async function fetchMapTilerGeocode(query: string, params: URLSearchParams): Promise<ForwardGeocodeHit[]> {
  const path = encodeURIComponent(query);
  const res = await fetch(`https://api.maptiler.com/geocoding/${path}.json?${params}`);
  if (!res.ok) return [];
  const json = (await res.json()) as MapTilerGeocodeResponse;
  return hitsFromMapTilerGeocodeJson(json);
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
  const baseParams = new URLSearchParams({
    key: MAPTILER_KEY,
    language: lang,
  });
  const strictParams = new URLSearchParams(baseParams);
  strictParams.set("limit", "10");
  strictParams.set("autocomplete", "false");
  strictParams.set("fuzzyMatch", "false");
  strictParams.set("types", "address");

  const broadParams = new URLSearchParams(baseParams);
  broadParams.set("limit", "10");
  broadParams.set("autocomplete", "true");
  broadParams.set("fuzzyMatch", "true");

  const [strictHits, broadHits] = await Promise.all([
    fetchMapTilerGeocode(q, strictParams),
    fetchMapTilerGeocode(q, broadParams),
  ]);

  const dedup = new Map<string, ForwardGeocodeHit>();
  for (const hit of [...strictHits, ...broadHits]) {
    const key = `${hit.lng},${hit.lat}:${hit.placeName}`;
    if (!dedup.has(key)) dedup.set(key, hit);
  }

  return [...dedup.values()]
    .map((hit) => ({ hit, score: scoreHit(q, hit.placeName) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.hit);
}
