import { useRef, useCallback, type MutableRefObject } from "react";
import maplibregl from "maplibre-gl";
import type { Project } from "@/lib/supabase";
import { STATUS_SOLID_COLORS, STATUS_ICON_PATHS } from "@/lib/projectStatus";

/**
 * Returns { outer, inner } where:
 *  - outer  is passed to maplibregl.Marker({ element }) — MapLibre owns its transform for positioning
 *  - inner  is the visual pin — applySelection animates its transform for the scale effect
 */
function createMarkerElement(status: number): { outer: HTMLElement; inner: HTMLElement } {
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

  outer.appendChild(inner);
  return { outer, inner };
}

function addMarker(
  map: maplibregl.Map,
  project: Project,
  markersMap: Map<string, HTMLElement>,
  markerObjectsMap: Map<string, maplibregl.Marker>,
  onClickProject: (project: Project) => void,
) {
  if (!project.location?.coordinates) return;
  const [lng, lat] = project.location.coordinates;
  const status = project.project_status ?? 0;
  const { outer, inner } = createMarkerElement(status);
  outer.classList.add("project-marker");
  outer.addEventListener("click", (e) => {
    e.stopPropagation();
    onClickProject(project);
  });
  const marker = new maplibregl.Marker({ element: outer, anchor: "bottom" });
  markersMap.set(project.project_id, inner); // inner for scale animation
  markerObjectsMap.set(project.project_id, marker);
  marker.setLngLat([lng, lat]).addTo(map);
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
  onProjectClick: MutableRefObject<(project: Project) => void>,
): ProjectMarkersHandle {
  const markersMapRef = useRef(new Map<string, HTMLElement>());
  const markerObjectsMapRef = useRef(new Map<string, maplibregl.Marker>());
  const selectedProjectIdRef = useRef<string | null>(null);

  const applySelection = useCallback(() => {
    const selectedId = selectedProjectIdRef.current;
    markersMapRef.current.forEach((el, id) => {
      el.style.transform = id === selectedId ? "scale(1.4)" : "";
    });
  }, []);

  const addProjectMarker = useCallback((map: maplibregl.Map, project: Project) => {
    addMarker(map, project, markersMapRef.current, markerObjectsMapRef.current, onProjectClick.current);
  }, [onProjectClick]);

  const removeProjectMarker = useCallback((projectId: string) => {
    const marker = markerObjectsMapRef.current.get(projectId);
    if (marker) {
      marker.remove();
      markerObjectsMapRef.current.delete(projectId);
      markersMapRef.current.delete(projectId);
    }
  }, []);

  const loadProjects = useCallback((map: maplibregl.Map, projects: Project[]) => {
    projects.forEach((p) => addMarker(map, p, markersMapRef.current, markerObjectsMapRef.current, onProjectClick.current));
  }, [onProjectClick]);

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
