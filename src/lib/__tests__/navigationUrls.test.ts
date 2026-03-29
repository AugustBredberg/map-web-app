import { describe, it, expect } from "vitest";
import {
  appleMapsDirectionsUrl,
  appleMapsDirectionsUrlFromAddress,
  googleMapsDirectionsUrl,
  googleMapsDirectionsUrlFromAddress,
  parseProjectCoordinates,
} from "@/lib/navigationUrls";

describe("navigationUrls", () => {
  it("builds Google directions URL with coordinates", () => {
    expect(googleMapsDirectionsUrl(59.3293, 18.0686)).toContain("destination=");
    expect(googleMapsDirectionsUrl(59.3293, 18.0686)).toMatch(/59\.3293(%2C|,)18\.0686/);
  });

  it("builds Apple directions URL with coordinates", () => {
    expect(appleMapsDirectionsUrl(59.3293, 18.0686)).toBe("https://maps.apple.com/?daddr=59.3293,18.0686");
  });

  it("encodes address strings for both providers", () => {
    const addr = "Storgatan 12, Stockholm";
    expect(googleMapsDirectionsUrlFromAddress(addr)).toContain(encodeURIComponent(addr));
    expect(appleMapsDirectionsUrlFromAddress(addr)).toContain(encodeURIComponent(addr));
  });

  it("parseProjectCoordinates reads GeoJSON order [lng, lat]", () => {
    expect(parseProjectCoordinates([18.0686, 59.3293])).toEqual({ lat: 59.3293, lng: 18.0686 });
    expect(parseProjectCoordinates(null)).toBeNull();
    expect(parseProjectCoordinates([1])).toBeNull();
    expect(parseProjectCoordinates([NaN, 1])).toBeNull();
  });
});
