"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase, type MapObject } from "@/lib/supabase";
import { useOrg } from "@/context/OrgContext";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

function addMarker(map: maplibregl.Map, obj: MapObject) {
  if (!obj.location?.coordinates) return;
  const [lng, lat] = obj.location.coordinates;
  const popup = new maplibregl.Popup({ offset: 12 }).setHTML(
    `<strong class="text-sm">${obj.title}</strong>`
  );
  new maplibregl.Marker({ color: "#3b82f6" })
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(map);
}

type Mode = "idle" | "form" | "placing" | "saving";

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { activeOrg } = useOrg();
  // Keep activeOrg in a ref so the map click handler always captures the latest value
  const activeOrgRef = useRef(activeOrg);
  useEffect(() => { activeOrgRef.current = activeOrg; }, [activeOrg]);

  const [mode, setMode] = useState<Mode>("idle");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pending title kept in a ref so the map click handler always sees the latest value
  const pendingTitle = useRef("");

  // Cancel placing mode
  const cancel = useCallback(() => {
    setMode("idle");
    setTitle("");
    setError(null);
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "";
    }
  }, []);

  // After the user confirms the title, switch to placing mode
  const startPlacing = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      pendingTitle.current = title.trim();
      setMode("placing");
      setError(null);
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = "crosshair";
      }
    },
    [title]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [11.9746, 57.7089], // Gothenburg, Sweden
      zoom: 10,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "bottom-right"
    );

    mapRef.current = map;

    map.once("load", async () => {
      const { data, error } = await supabase
        .from("map_objects")
        .select("id, created_at, user_id, title, location");
      if (error) {
        console.error("Failed to load map_objects:", error.message);
        return;
      }
      (data as MapObject[]).forEach((obj) => addMarker(map, obj));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Attach/detach the click-to-place handler whenever mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (mode !== "placing") return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      map.getCanvas().style.cursor = "";
      setMode("saving");

      const { data, error } = await supabase
        .from("map_objects")
        .insert({
          title: pendingTitle.current,
          // PostGIS POINT — WKT format is accepted by the REST API
          location: `POINT(${lng} ${lat})`,
          organization_id: activeOrgRef.current?.organization_id ?? null,
        })
        .select("id, created_at, user_id, title, location")
        .single();

      if (error) {
        console.error("Failed to save map object:", error.message);
        setError(error.message);
        setMode("form");
        return;
      }

      addMarker(map, data as MapObject);
      setMode("idle");
      setTitle("");
      setError(null);
    };

    map.once("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [mode]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Floating + button */}
      {mode === "idle" && (
        <button
          onClick={() => setMode("form")}
          aria-label="Add map object"
          className="absolute bottom-24 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}

      {/* Title form */}
      {(mode === "form" || mode === "saving") && (
        <div className="absolute bottom-24 left-4 w-64 rounded-xl bg-gray-900 p-4 shadow-xl ring-1 ring-white/10">
          <p className="mb-3 text-sm font-semibold text-white">
            New map object
          </p>
          <form onSubmit={startPlacing} className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-white/10 focus:ring-blue-500"
            />
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!title.trim() || mode === "saving"}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
              >
                Place on map
              </button>
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Placing hint */}
      {mode === "placing" && (
        <div className="absolute bottom-24 left-4 flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 shadow-xl ring-1 ring-white/10">
          <span className="text-sm text-gray-200">
            Click on the map to place{" "}
            <strong className="text-white">
              &ldquo;{title}&rdquo;
            </strong>
          </span>
          <button
            onClick={cancel}
            className="text-xs text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
