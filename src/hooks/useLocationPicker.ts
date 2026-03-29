import { useEffect, useRef, useCallback, type MutableRefObject } from "react";
import maplibregl from "maplibre-gl";
import type { PinCoords } from "@/context/NewProjectContext";

export function useLocationPicker(
  mapRef: MutableRefObject<maplibregl.Map | null>,
  isActive: boolean,
  onPick: (loc: PinCoords) => void,
  initialLocation?: PinCoords | null,
  cleanupOnDeactivate = true,
) {
  const tempMarkerRef = useRef<maplibregl.Marker | null>(null);

  /** Place or move the temp pin and pan the map (e.g. after address search). */
  const placePinOnMap = useCallback(
    (coords: PinCoords) => {
      const map = mapRef.current;
      if (!map) return;
      const { lng, lat } = coords;
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setLngLat([lng, lat]);
      } else {
        const marker = new maplibregl.Marker({ color: "#f59e0b" });
        marker.getElement().classList.add("temp-pin");
        marker.setLngLat([lng, lat]).addTo(map);
        tempMarkerRef.current = marker;
      }
      map.easeTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 16),
        duration: 550,
      });
    },
    [mapRef],
  );

  // Crosshair cursor + click handler while the user is picking a location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isActive) return;

    map.getCanvas().style.cursor = "crosshair";

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      onPick({ lng, lat });
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
  }, [mapRef, isActive, onPick]);

  // Place a temp marker at the project's existing location when editing starts
  useEffect(() => {
    if (!isActive || !initialLocation || !mapRef.current) return;
    if (tempMarkerRef.current) return;
    const marker = new maplibregl.Marker({ color: "#f59e0b" });
    marker.getElement().classList.add("temp-pin");
    marker.setLngLat([initialLocation.lng, initialLocation.lat]).addTo(mapRef.current);
    tempMarkerRef.current = marker;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Remove the temp pin whenever not active (only if cleanupOnDeactivate is true)
  useEffect(() => {
    if (!isActive && cleanupOnDeactivate) {
      tempMarkerRef.current?.remove();
      tempMarkerRef.current = null;
    }
  }, [isActive, cleanupOnDeactivate]);

  return { tempMarkerRef, placePinOnMap };
}
