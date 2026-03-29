import { describe, it, expect } from "vitest";
import { hitsFromMapTilerGeocodeJson } from "@/lib/maptilerGeocoding";

describe("hitsFromMapTilerGeocodeJson", () => {
  it("maps GeoJSON features to hits", () => {
    const hits = hitsFromMapTilerGeocodeJson({
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [18.0686, 59.3293] },
          place_name: "Stockholm, Sweden",
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [11.97, 57.7] },
          place_name: "Gothenburg, Sweden",
        },
      ],
    });
    expect(hits).toHaveLength(2);
    expect(hits[0]).toEqual({
      placeName: "Stockholm, Sweden",
      lng: 18.0686,
      lat: 59.3293,
    });
  });

  it("skips features without coordinates or place_name", () => {
    expect(
      hitsFromMapTilerGeocodeJson({
        features: [
          { geometry: { type: "Point", coordinates: [] }, place_name: "x" },
          { geometry: { type: "Point", coordinates: [1, 2] } },
        ],
      }),
    ).toHaveLength(0);
  });
});
