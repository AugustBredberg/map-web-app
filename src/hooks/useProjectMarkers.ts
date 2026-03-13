import { useRef, useCallback, type MutableRefObject } from "react";
import maplibregl from "maplibre-gl";
import type { Project } from "@/lib/supabase";

function addMarker(
  map: maplibregl.Map,
  project: Project,
  markersMap: Map<string, HTMLElement>,
  markerObjectsMap: Map<string, maplibregl.Marker>,
  onClickProject: (project: Project) => void,
) {
  if (!project.location?.coordinates) return;
  const [lng, lat] = project.location.coordinates;
  const marker = new maplibregl.Marker({ color: "#3b82f6" });
  const el = marker.getElement();
  el.classList.add("project-marker");
  el.style.cursor = "pointer";
  const pin = el.firstElementChild as HTMLElement;
  pin.style.transition = "transform 0.15s ease";
  pin.style.transformOrigin = "bottom center";
  markersMap.set(project.project_id, pin);
  markerObjectsMap.set(project.project_id, marker);
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onClickProject(project);
  });
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
