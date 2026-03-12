"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase, type MapObject } from "@/lib/supabase";
import { useOrg } from "@/context/OrgContext";
import { useDrawer } from "@/context/DrawerContext";
import { useNewProject } from "@/context/NewProjectContext";
import CreateProjectForm from "@/components/CreateProjectForm";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

function addMarker(map: maplibregl.Map, obj: MapObject) {
  if (!obj.location?.coordinates) return;
  const [lng, lat] = obj.location.coordinates;
  const popup = new maplibregl.Popup({ offset: 12 }).setHTML(
    `<strong class="text-sm">${obj.title}</strong>`
  );
  const marker = new maplibregl.Marker({ color: "#3b82f6" });
  marker.getElement().classList.add("project-marker");
  marker.setLngLat([lng, lat]).setPopup(popup).addTo(map);
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const tempMarkerRef = useRef<maplibregl.Marker | null>(null);

  const { activeOrg } = useOrg();
  // Keep activeOrg in a ref so the map click handler always captures the latest value
  const activeOrgRef = useRef(activeOrg);
  useEffect(() => { activeOrgRef.current = activeOrg; }, [activeOrg]);

  const { openDrawer, closeDrawer, isOpen: drawerOpen } = useDrawer();

  const {
    isCreating,
    title: newProjectTitle,
    location: pickedLocation,
    setLocation,
    submitRequested,
    onSubmitHandled,
    startCreating,
    cancelCreating,
  } = useNewProject();

  const handleAddClick = useCallback(() => {
    startCreating();
    openDrawer(<CreateProjectForm />, { onClose: cancelCreating, backdrop: false });
  }, [startCreating, openDrawer, cancelCreating]);

  // Map initialisation
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

  // Crosshair cursor + click handler while the user is picking a location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isCreating) return;

    map.getCanvas().style.cursor = "crosshair";

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      setLocation({ lng, lat });
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setLngLat([lng, lat]);
      } else {
        const marker = new maplibregl.Marker({ color: "#f59e0b" });
        marker.getElement().classList.add("temp-pin");
        marker.setLngLat([lng, lat]).addTo(map);
        tempMarkerRef.current = marker;
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [isCreating, setLocation]);

  // Remove the temp pin whenever the creation flow ends
  useEffect(() => {
    if (!isCreating) {
      tempMarkerRef.current?.remove();
      tempMarkerRef.current = null;
    }
  }, [isCreating]);

  // Watch for the form's "Create Project" submission and run the DB insert
  useEffect(() => {
    if (!submitRequested || !pickedLocation) return;

    let cancelled = false;
    const { lng, lat } = pickedLocation;
    const titleToSave = newProjectTitle;
    const orgId = activeOrgRef.current?.organization_id ?? null;

    supabase
      .from("map_objects")
      .insert({
        title: titleToSave,
        location: `POINT(${lng} ${lat})`,
        organization_id: orgId,
      })
      .select("id, created_at, user_id, title, location")
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to save map object:", error.message);
          onSubmitHandled(error.message);
        } else {
          tempMarkerRef.current?.remove();
          tempMarkerRef.current = null;
          if (mapRef.current) addMarker(mapRef.current, data as MapObject);
          onSubmitHandled();
          closeDrawer();
        }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitRequested]);


  return (
    <div className={`relative h-full w-full${isCreating ? " map-creating" : ""}`}>
      <div ref={containerRef} className="h-full w-full" />

      {/* Floating + button — hidden while the drawer is open or creation is in progress */}
      {!isCreating && !drawerOpen && (
        <button
          onClick={handleAddClick}
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

      {/* Map hint — nudge the user to click the map when no location is set yet */}
      {isCreating && !pickedLocation && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-gray-900/80 px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <span className="text-sm text-white">Tap the map to set a location</span>
        </div>
      )}
    </div>
  );
}
