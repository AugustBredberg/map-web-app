import { useRef, useCallback, type MutableRefObject } from "react";
import maplibregl from "maplibre-gl";
import type { Project } from "@/lib/supabase";
import { STATUS_SOLID_COLORS, STATUS_ICON_PATHS } from "@/lib/projectStatus";

// A stable key identifying a physical map location — uses customer_location_id when available.
type LocKey = string;

function getLocKey(project: Project): LocKey | null {
  if (project.customer_location_id) return `loc:${project.customer_location_id}`;
  const coords = project.customer_location?.location?.coordinates;
  if (coords) return `coord:${coords[0]},${coords[1]}`;
  return null;
}

/**
 * Returns { outer, inner } where:
 *  - outer  is passed to maplibregl.Marker({ element }) — MapLibre owns its transform for positioning
 *  - inner  is the visual pin — applySelection animates its transform for the scale effect
 *
 * When count > 1 a small badge with the count is rendered on the pin.
 */
function createMarkerElement(status: number, count: number): { outer: HTMLElement; inner: HTMLElement } {
  const color = STATUS_SOLID_COLORS[status] ?? STATUS_SOLID_COLORS[0];
  const iconPath = STATUS_ICON_PATHS[status] ?? STATUS_ICON_PATHS[0];

  // outer wrapper: MapLibre will position this — we never touch its transform
  const outer = document.createElement("div");
  outer.style.cssText = "cursor:pointer;";

  // inner wrapper: we apply the scale animation here
  const inner = document.createElement("div");
  inner.style.cssText =
    "position:relative;width:36px;height:44px;" +
    "transition:transform 0.15s ease;transform-origin:bottom center;";

  const head = document.createElement("div");
  head.style.cssText =
    "position:absolute;top:0;left:0;width:36px;height:36px;border-radius:50%;" +
    `background:${color};border:2px solid white;` +
    "box-shadow:0 2px 6px rgba(0,0,0,0.35);" +
    "display:flex;align-items:center;justify-content:center;";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "white");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("d", iconPath);
  svg.appendChild(path);
  head.appendChild(svg);
  inner.appendChild(head);

  const tail = document.createElement("div");
  tail.style.cssText =
    "position:absolute;bottom:0;left:50%;transform:translateX(-50%);" +
    "width:0;height:0;" +
    `border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${color};`;
  inner.appendChild(tail);

  // Stack count badge — shown when more than one project shares this location
  if (count > 1) {
    const badge = document.createElement("div");
    badge.style.cssText =
      "position:absolute;top:-4px;right:-4px;" +
      "min-width:18px;height:18px;border-radius:9px;padding:0 3px;" +
      "background:#1d4ed8;border:1.5px solid white;" +
      "display:flex;align-items:center;justify-content:center;" +
      "font-size:10px;font-weight:700;color:white;line-height:1;box-sizing:border-box;";
    badge.textContent = String(count);
    inner.appendChild(badge);
  }

  outer.appendChild(inner);
  return { outer, inner };
}

export interface ProjectMarkersHandle {
  markersMapRef: MutableRefObject<Map<string, HTMLElement>>;
  markerObjectsMapRef: MutableRefObject<Map<string, maplibregl.Marker>>;
  selectedProjectIdRef: MutableRefObject<string | null>;
  applySelection: () => void;
  addProjectMarker: (map: maplibregl.Map, project: Project) => void;
  removeProjectMarker: (projectId: string) => void;
  loadProjects: (map: maplibregl.Map, projects: Project[]) => void;
}

export function useProjectMarkers(
  onProjectGroupClick: MutableRefObject<(projects: Project[]) => void>,
): ProjectMarkersHandle {
  // keyed by LocKey (not project_id)
  const markersMapRef = useRef(new Map<LocKey, HTMLElement>());
  const markerObjectsMapRef = useRef(new Map<LocKey, maplibregl.Marker>());
  // locKey → all projects at that location
  const locationGroupsRef = useRef(new Map<LocKey, Project[]>());
  // project_id → locKey  (fast reverse lookup for remove/update)
  const projectLocKeyRef = useRef(new Map<string, LocKey>());
  const selectedProjectIdRef = useRef<string | null>(null);
  // stored so removeProjectMarker can recreate markers without needing the map passed explicitly
  const latestMapRef = useRef<maplibregl.Map | null>(null);

  const applySelection = useCallback(() => {
    const selectedId = selectedProjectIdRef.current;
    markersMapRef.current.forEach((el, locKey) => {
      const group = locationGroupsRef.current.get(locKey) ?? [];
      const isSelected = selectedId !== null && group.some((p) => p.project_id === selectedId);
      el.style.transform = isSelected ? "scale(1.4)" : "";
    });
  }, []);

  const eraseGroupMarker = useCallback((locKey: LocKey) => {
    markerObjectsMapRef.current.get(locKey)?.remove();
    markerObjectsMapRef.current.delete(locKey);
    markersMapRef.current.delete(locKey);
  }, []);

  const placeGroupMarker = useCallback(
    (map: maplibregl.Map, locKey: LocKey, projects: Project[]) => {
      const coords = projects[0]?.customer_location?.location?.coordinates;
      if (!coords) return;
      const [lng, lat] = coords;
      const status = projects[0].project_status ?? 0;
      const { outer, inner } = createMarkerElement(status, projects.length);
      outer.classList.add("project-marker");
      outer.addEventListener("click", (e) => {
        e.stopPropagation();
        onProjectGroupClick.current([...projects]);
      });
      const marker = new maplibregl.Marker({ element: outer, anchor: "bottom" });
      markersMapRef.current.set(locKey, inner);
      markerObjectsMapRef.current.set(locKey, marker);
      marker.setLngLat([lng, lat]).addTo(map);
    },
    [onProjectGroupClick],
  );

  const addProjectMarker = useCallback(
    (map: maplibregl.Map, project: Project) => {
      latestMapRef.current = map;
      const locKey = getLocKey(project);
      if (!locKey) return;

      const existingGroup = locationGroupsRef.current.get(locKey);
      eraseGroupMarker(locKey);

      const updatedGroup = existingGroup ? [...existingGroup, project] : [project];
      locationGroupsRef.current.set(locKey, updatedGroup);
      projectLocKeyRef.current.set(project.project_id, locKey);
      placeGroupMarker(map, locKey, updatedGroup);
    },
    [placeGroupMarker, eraseGroupMarker],
  );

  const removeProjectMarker = useCallback(
    (projectId: string) => {
      const locKey = projectLocKeyRef.current.get(projectId);
      if (!locKey) return;

      projectLocKeyRef.current.delete(projectId);
      eraseGroupMarker(locKey);

      const remaining = (locationGroupsRef.current.get(locKey) ?? []).filter(
        (p) => p.project_id !== projectId,
      );

      if (remaining.length === 0) {
        locationGroupsRef.current.delete(locKey);
      } else {
        locationGroupsRef.current.set(locKey, remaining);
        // Recreate the group marker without the removed project
        if (latestMapRef.current) {
          placeGroupMarker(latestMapRef.current, locKey, remaining);
        }
      }
    },
    [placeGroupMarker, eraseGroupMarker],
  );

  const loadProjects = useCallback(
    (map: maplibregl.Map, projects: Project[]) => {
      latestMapRef.current = map;

      // Remove all existing markers from the map and clear tracking state
      markerObjectsMapRef.current.forEach((m) => m.remove());
      markersMapRef.current.clear();
      markerObjectsMapRef.current.clear();
      locationGroupsRef.current.clear();
      projectLocKeyRef.current.clear();

      if (projects.length === 0) return;

      // Group projects by their location key
      const groups = new Map<LocKey, Project[]>();
      for (const p of projects) {
        const locKey = getLocKey(p);
        if (!locKey) continue;
        const arr = groups.get(locKey) ?? [];
        arr.push(p);
        groups.set(locKey, arr);
        projectLocKeyRef.current.set(p.project_id, locKey);
      }

      // Place one marker per group
      groups.forEach((groupProjects, locKey) => {
        locationGroupsRef.current.set(locKey, groupProjects);
        placeGroupMarker(map, locKey, groupProjects);
      });
    },
    [placeGroupMarker],
  );

  return {
    markersMapRef,
    markerObjectsMapRef,
    selectedProjectIdRef,
    applySelection,
    addProjectMarker,
    removeProjectMarker,
    loadProjects,
  };
}
