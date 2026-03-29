/**
 * Deep links for turn-by-turn navigation. Coordinates are WGS84 (lat, lng).
 * GeoJSON order is [lng, lat]; callers should pass explicit lat/lng.
 */

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  const dest = `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

export function appleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}`;
}

export function appleMapsDirectionsUrlFromAddress(address: string): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(address.trim())}`;
}

export function googleMapsDirectionsUrlFromAddress(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
}

export function parseProjectCoordinates(
  coords: [number, number] | null | undefined,
): { lat: number; lng: number } | null {
  if (!coords || coords.length !== 2) return null;
  const [lng, lat] = coords;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
