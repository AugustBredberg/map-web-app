"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type Project } from "@/lib/supabase";
import { fetchProjects, createProject, updateProject } from "@/lib/projects";
import { useOrg } from "@/context/OrgContext";
import { useDrawer } from "@/context/DrawerContext";
import { useNewProject } from "@/context/NewProjectContext";
import CreateProjectForm from "@/components/CreateProjectForm";
import ProjectDetailsPanel from "@/components/ProjectDetailsPanel";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

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
  // Scale the inner SVG only — the root element's transform is owned by MapLibre for positioning
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

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const tempMarkerRef = useRef<maplibregl.Marker | null>(null);

  const { activeOrg } = useOrg();
  // Keep activeOrg in a ref so the map click handler always captures the latest value
  const activeOrgRef = useRef(activeOrg);
  useEffect(() => { activeOrgRef.current = activeOrg; }, [activeOrg]);

  const { openDrawer, closeDrawer, isOpen: drawerOpen } = useDrawer();
  const openDrawerRef = useRef(openDrawer);
  useEffect(() => { openDrawerRef.current = openDrawer; }, [openDrawer]);

  const markersMapRef = useRef(new Map<string, HTMLElement>());
  const markerObjectsMapRef = useRef(new Map<string, maplibregl.Marker>());
  const selectedProjectIdRef = useRef<string | null>(null);

  const applySelectionRef = useRef(() => {
    const selectedId = selectedProjectIdRef.current;
    markersMapRef.current.forEach((el, id) => {
      el.style.transform = id === selectedId ? "scale(1.4)" : "";
    });
  });

  const handleProjectClickRef = useRef((project: Project) => {
    selectedProjectIdRef.current = project.project_id;
    applySelectionRef.current();

    // On mobile, pan so the pin sits at 25% from the top (above the 50% drawer)
    if (window.innerWidth < 768 && project.location?.coordinates && mapRef.current) {
      const [lng, lat] = project.location.coordinates;
      mapRef.current.easeTo({
        center: [lng, lat],
        offset: [0, -window.innerHeight * 0.2],
        duration: 300,
      });
    }

    openDrawerRef.current(<ProjectDetailsPanel project={project} onEditClose={() => {
      selectedProjectIdRef.current = null;
      applySelectionRef.current();
    }} />, {
      title: project.title,
      backdrop: false,
      onClose: () => {
        selectedProjectIdRef.current = null;
        applySelectionRef.current();
      },
    });
  });

  const {
    isCreating,
    isEditing,
    editingProjectId,
    title: newProjectTitle,
    status: newProjectStatus,
    startTime: newProjectStartTime,
    assignees: newProjectAssignees,
    location: pickedLocation,
    setLocation,
    submitRequested,
    onSubmitHandled,
    startCreating,
    cancelCreating,
  } = useNewProject();

  // Keep status, startTime and assignees in refs so the submit effect always captures the latest values
  const statusRef = useRef(newProjectStatus);
  useEffect(() => { statusRef.current = newProjectStatus; }, [newProjectStatus]);
  const startTimeRef = useRef(newProjectStartTime);
  useEffect(() => { startTimeRef.current = newProjectStartTime; }, [newProjectStartTime]);
  const assigneesRef = useRef(newProjectAssignees);
  useEffect(() => { assigneesRef.current = newProjectAssignees; }, [newProjectAssignees]);
  const isEditingRef = useRef(isEditing);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  const editingProjectIdRef = useRef(editingProjectId);
  useEffect(() => { editingProjectIdRef.current = editingProjectId; }, [editingProjectId]);

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
    const markersMap = markersMapRef.current;
    const markerObjects = markerObjectsMapRef.current;

    map.on("render", () => applySelectionRef.current());

    map.once("load", async () => {
      const { data, error } = await fetchProjects();
      if (error) {
        console.error("Failed to load projects:", error);
        return;
      }
      (data as Project[]).forEach((p) => addMarker(map, p, markersMap, markerObjects, handleProjectClickRef.current));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersMap.clear();
      markerObjects.clear();
    };
  }, []);

  // Crosshair cursor + click handler while the user is picking a location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || (!isCreating && !isEditing)) return;

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
  }, [isCreating, isEditing, setLocation]);

  // Place a temp marker at the project's existing location when editing starts
  useEffect(() => {
    if (!isEditing || !pickedLocation || !mapRef.current) return;
    if (tempMarkerRef.current) return; // already placed
    const marker = new maplibregl.Marker({ color: "#f59e0b" });
    marker.getElement().classList.add("temp-pin");
    marker.setLngLat([pickedLocation.lng, pickedLocation.lat]).addTo(mapRef.current);
    tempMarkerRef.current = marker;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Remove the temp pin whenever neither creation nor edit flow is active
  useEffect(() => {
    if (!isCreating && !isEditing) {
      tempMarkerRef.current?.remove();
      tempMarkerRef.current = null;
    }
  }, [isCreating, isEditing]);

  // Watch for form submission and run the DB insert (create) or update (edit)
  useEffect(() => {
    if (!submitRequested || !pickedLocation) return;

    let cancelled = false;
    const { lng, lat } = pickedLocation;
    const titleToSave = newProjectTitle;
    const statusToSave = statusRef.current;
    const startTimeToSave = startTimeRef.current || null;
    const assigneesToSave = assigneesRef.current;
    const orgId = activeOrgRef.current?.organization_id ?? null;

    const run = async () => {
      if (isEditingRef.current && editingProjectIdRef.current) {
        // Edit flow — UPDATE existing project
        const projectId = editingProjectIdRef.current;
        const { data: project, error } = await updateProject(
          projectId,
          {
            title: titleToSave,
            project_status: statusToSave,
            start_time: startTimeToSave,
            location: `POINT(${lng} ${lat})`,
          },
          assigneesToSave,
          orgId,
        );

        if (cancelled) return;
        if (error) {
          console.error("Failed to update project:", error);
          onSubmitHandled(error);
          return;
        }

        // Replace the map marker with updated data
        const oldMarker = markerObjectsMapRef.current.get(projectId);
        if (oldMarker) {
          oldMarker.remove();
          markerObjectsMapRef.current.delete(projectId);
          markersMapRef.current.delete(projectId);
        }
        tempMarkerRef.current?.remove();
        tempMarkerRef.current = null;
        if (mapRef.current) addMarker(mapRef.current, project!, markersMapRef.current, markerObjectsMapRef.current, handleProjectClickRef.current);
        onSubmitHandled();
        closeDrawer();
      } else {
        // Create flow — INSERT new project
        const { data: project, error } = await createProject(
          {
            title: titleToSave,
            project_status: statusToSave,
            start_time: startTimeToSave,
            location: `POINT(${lng} ${lat})`,
            organization_id: orgId,
          },
          assigneesToSave,
        );

        if (cancelled) return;
        if (error) {
          console.error("Failed to save project:", error);
          onSubmitHandled(error);
          return;
        }

        tempMarkerRef.current?.remove();
        tempMarkerRef.current = null;
        if (mapRef.current) addMarker(mapRef.current, project!, markersMapRef.current, markerObjectsMapRef.current, handleProjectClickRef.current);
        onSubmitHandled();
        closeDrawer();
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitRequested]);


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
