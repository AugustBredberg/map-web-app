"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type Project } from "@/lib/supabase";
import { fetchProjects } from "@/lib/projects";
import { useDrawer } from "@/context/DrawerContext";
import { useNewProject } from "@/context/NewProjectContext";
import { useProjectMarkers } from "@/hooks/useProjectMarkers";
import { useLocationPicker } from "@/hooks/useLocationPicker";
import CreateProjectForm from "@/components/CreateProjectForm";
import ProjectDetailsPanel from "@/components/ProjectDetailsPanel";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { openDrawer, closeDrawer, isOpen: drawerOpen } = useDrawer();
  const openDrawerRef = useRef(openDrawer);
  useEffect(() => { openDrawerRef.current = openDrawer; }, [openDrawer]);

  const handleProjectClickRef = useRef((project: Project) => {
    markers.selectedProjectIdRef.current = project.project_id;
    markers.applySelection();

    if (window.innerWidth < 768 && project.location?.coordinates && mapRef.current) {
      const [lng, lat] = project.location.coordinates;
      mapRef.current.easeTo({
        center: [lng, lat],
        offset: [0, -window.innerHeight * 0.2],
        duration: 300,
      });
    }

    openDrawerRef.current(<ProjectDetailsPanel project={project} onEditClose={() => {
      markers.selectedProjectIdRef.current = null;
      markers.applySelection();
    }} />, {
      title: project.title,
      backdrop: false,
      onClose: () => {
        markers.selectedProjectIdRef.current = null;
        markers.applySelection();
      },
    });
  });

  const markers = useProjectMarkers(handleProjectClickRef);

  const {
    isCreating,
    isEditing,
    editingProjectId,
    location: pickedLocation,
    setLocation,
    startCreating,
    cancelCreating,
    setOnProjectSaved,
    setOnProjectDeleted,
  } = useNewProject();

  const isPickerActive = isCreating || isEditing;
  const tempMarkerRef = useLocationPicker(mapRef, isPickerActive, setLocation, isEditing ? pickedLocation : null);

  // Register a callback so the context can notify us after a successful save
  const editingProjectIdRef = useRef(editingProjectId);
  useEffect(() => { editingProjectIdRef.current = editingProjectId; }, [editingProjectId]);

  useEffect(() => {
    setOnProjectSaved((project: Project) => {
      if (editingProjectIdRef.current) {
        markers.removeProjectMarker(editingProjectIdRef.current);
      }
      tempMarkerRef.current?.remove();
      tempMarkerRef.current = null;
      if (mapRef.current) {
        markers.addProjectMarker(mapRef.current, project);
      }
      closeDrawer();
    });
    return () => setOnProjectSaved(null);
  }, [setOnProjectSaved, closeDrawer, markers, tempMarkerRef]);

  useEffect(() => {
    setOnProjectDeleted((projectId: string) => {
      markers.removeProjectMarker(projectId);
      tempMarkerRef.current?.remove();
      tempMarkerRef.current = null;
      closeDrawer();
    });
    return () => setOnProjectDeleted(null);
  }, [setOnProjectDeleted, closeDrawer, markers, tempMarkerRef]);

  const handleAddClick = useCallback(() => {
    startCreating();
    openDrawer(<CreateProjectForm />, { onClose: cancelCreating, backdrop: false, title: "New Project" });
  }, [startCreating, openDrawer, cancelCreating]);

  // Map initialisation
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [11.9746, 57.7089],
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

    map.on("render", () => markers.applySelection());

    map.once("load", async () => {
      const { data, error } = await fetchProjects();
      if (error) {
        console.error("Failed to load projects:", error);
        return;
      }
      markers.loadProjects(map, data as Project[]);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markers.markersMapRef.current.clear();
      markers.markerObjectsMapRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return (
    <div className={`relative h-full w-full${(isCreating || isEditing) ? " map-creating" : ""}`}>
      <div ref={containerRef} className="h-full w-full" />

      {/* Floating + button — hidden while the drawer is open or creation is in progress */}
      {!isCreating && !drawerOpen && (
        <Button
          isIconOnly
          color="primary"
          radius="full"
          size="lg"
          onPress={handleAddClick}
          aria-label="Add map object"
          className="absolute bottom-24 left-4 shadow-lg"
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
        </Button>
      )}

      {/* Map hint — nudge the user to click the map when no location is set yet */}
      {(isCreating || isEditing) && !pickedLocation && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-gray-900/80 px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <span className="text-sm text-white">Tap the map to set a location</span>
        </div>
      )}
    </div>
  );
}
