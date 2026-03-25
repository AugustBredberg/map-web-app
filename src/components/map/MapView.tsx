"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@heroui/react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type Project, hasMinRole } from "@/lib/supabase";
import type { OrganizationMember } from "@/lib/supabase";
import { fetchProjects } from "@/lib/projects";
import type { ProjectFetchFilters } from "@/lib/projects";
import { getOrgMembers } from "@/lib/members";
import { useDrawer } from "@/context/DrawerContext";
import { useOrg } from "@/context/OrgContext";
import { useNewProject } from "@/context/NewProjectContext";
import { useProjectMarkers } from "@/hooks/useProjectMarkers";
import { useLocationPicker } from "@/hooks/useLocationPicker";
import CreateProjectPanel from "@/components/project/CreateProjectPanel";
import ProjectDetailsPanel from "@/components/project/ProjectDetailsPanel";
import ProjectStackPanel from "@/components/project/ProjectStackPanel";
import ProjectFilters from "@/components/project/ProjectFilters";
import { useLocale } from "@/context/LocaleContext";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
const MAP_STYLE_LIGHT = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const MAP_STYLE_DARK = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { resolvedTheme } = useTheme();
  const themeInitialized = useRef(false);

  const { openDrawer, closeDrawer, isOpen: drawerOpen } = useDrawer();
  const { activeRole, activeOrg } = useOrg();
  const { t } = useLocale();
  const mapReadyRef = useRef(false);

  // Filter state
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [activeTimeFilter, setActiveTimeFilter] = useState<string | null>("all");
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<string>>(new Set());
  const [activeAssigneeFilters, setActiveAssigneeFilters] = useState<Set<string>>(new Set());

  const handleTimeFilterChange = useCallback((id: string | null) => setActiveTimeFilter(id), []);
  const handleStatusFiltersChange = useCallback((filters: Set<string>) => setActiveStatusFilters(filters), []);
  const handleAssigneeFiltersChange = useCallback((filters: Set<string>) => setActiveAssigneeFilters(filters), []);

  const openFiltersDrawer = useCallback(() => {
    openDrawer(
      <ProjectFilters
        members={members}
        defaultTimeFilter={activeTimeFilter}
        defaultStatusFilters={activeStatusFilters}
        defaultAssigneeFilters={activeAssigneeFilters}
        onTimeFilterChange={handleTimeFilterChange}
        onStatusFiltersChange={handleStatusFiltersChange}
        onAssigneeFiltersChange={handleAssigneeFiltersChange}
      />,
      { title: t("projects.filtersDrawerTitle"), backdrop: true },
    );
  }, [openDrawer, members, activeTimeFilter, activeStatusFilters, activeAssigneeFilters, handleTimeFilterChange, handleStatusFiltersChange, handleAssigneeFiltersChange, t]);
  const openDrawerRef = useRef(openDrawer);
  useEffect(() => { openDrawerRef.current = openDrawer; }, [openDrawer]);

  const handleProjectGroupClickRef = useRef((projects: Project[]) => {
    const first = projects[0];
    markers.selectedProjectIdRef.current = first.project_id;
    markers.applySelection();

    if (window.innerWidth < 768 && first.customer_location?.location?.coordinates && mapRef.current) {
      const [lng, lat] = first.customer_location.location.coordinates;
      mapRef.current.easeTo({
        center: [lng, lat],
        offset: [0, -window.innerHeight * 0.2],
        duration: 300,
      });
    }

    const onProjectUpdated = (updated: Project) => {
      if (mapRef.current) {
        markers.removeProjectMarker(updated.project_id);
        markers.addProjectMarker(mapRef.current, updated);
        markers.applySelection();
      }
    };

    const drawerOptions = {
      title: t("projectDetails.title"),
      backdrop: false,
      onClose: () => {
        markers.selectedProjectIdRef.current = null;
        markers.applySelection();
      },
    };

    if (projects.length === 1) {
      openDrawerRef.current(
        <ProjectDetailsPanel project={first} onProjectUpdated={onProjectUpdated} />,
        drawerOptions,
      );
    } else {
      openDrawerRef.current(
        <ProjectStackPanel projects={projects} onProjectUpdated={onProjectUpdated} />,
        drawerOptions,
      );
    }
  });

  const markers = useProjectMarkers(handleProjectGroupClickRef);

  const {
    step,
    pinPlaced,
    startCreating,
    cancelCreating,
    setOnProjectSaved,
  } = useNewProject();

  const isInPinMode = step === "pin";
  const isCreating = step !== "idle";

  const tempMarkerRef = useLocationPicker(mapRef, isInPinMode, pinPlaced, null, false);

  useEffect(() => {
    setOnProjectSaved((project: Project) => {
      tempMarkerRef.current?.remove();
      tempMarkerRef.current = null;
      if (mapRef.current) {
        markers.addProjectMarker(mapRef.current, project);
      }
      closeDrawer();
    });
    return () => setOnProjectSaved(null);
  }, [setOnProjectSaved, closeDrawer, markers, tempMarkerRef]);

  // Remove temp marker when creation is cancelled or completed (step → idle)
  useEffect(() => {
    if (step === "idle") {
      tempMarkerRef.current?.remove();
      tempMarkerRef.current = null;
    }
  }, [step, tempMarkerRef]);

  const handleAddClick = useCallback(() => {
    startCreating();
    openDrawer(<CreateProjectPanel />, { onClose: cancelCreating, backdrop: false, title: t("createProjectWizard.drawerTitle") });
  }, [startCreating, openDrawer, cancelCreating, t]);

  // Map initialisation
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
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

    map.once("load", () => {
      mapReadyRef.current = true;
    });

    return () => {
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
      markers.markersMapRef.current.clear();
      markers.markerObjectsMapRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch map style when the theme changes
  useEffect(() => {
    if (!themeInitialized.current) {
      themeInitialized.current = true;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT);
  }, [resolvedTheme]);

  // Reload projects whenever the active org or filters change
  useEffect(() => {
    if (!activeOrg) return;

    const load = async (map: maplibregl.Map) => {
      markers.loadProjects(map, []);
      markers.markersMapRef.current.forEach((el) => el.remove());
      markers.markersMapRef.current.clear();
      markers.markerObjectsMapRef.current.forEach((m) => m.remove());
      markers.markerObjectsMapRef.current.clear();

      const filters: ProjectFetchFilters = {
        timeFilter: activeTimeFilter as ProjectFetchFilters["timeFilter"],
        statusFilters: [...activeStatusFilters].map(Number),
        assigneeUserIds: [...activeAssigneeFilters],
      };
      const { data, error } = await fetchProjects(activeOrg.organization_id, filters);
      if (error) {
        console.error("Failed to load projects:", error);
        return;
      }
      markers.loadProjects(map, data as Project[]);
    };

    if (mapReadyRef.current && mapRef.current) {
      void load(mapRef.current);
    } else {
      // Map not ready yet — wait for the load event
      const waitForMap = () => {
        if (mapRef.current) {
          mapRef.current.once("load", () => void load(mapRef.current!));
        }
      };
      waitForMap();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg, activeTimeFilter, activeStatusFilters, activeAssigneeFilters]);

  // Load org members once
  useEffect(() => {
    if (!activeOrg) return;
    const load = async () => {
      const { data } = await getOrgMembers(activeOrg.organization_id);
      setMembers(data ?? []);
    };
    load();
  }, [activeOrg]);



  return (
    <div className={`relative h-full w-full${isCreating ? " map-creating" : ""}`}>
      <div ref={containerRef} className="h-full w-full" />

      {/* Filter toggle button — mobile only */}
      <Button
        isIconOnly
        variant="flat"
        size="sm"
        onPress={openFiltersDrawer}
        aria-label={t("map.toggleFilters")}
        className="absolute left-4 top-4 z-10 bg-white shadow-md text-gray-600 md:hidden"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
      </Button>

      {/* Desktop filter panel — always visible */}
      <div className="absolute left-4 top-4 z-10 hidden w-52 rounded-xl bg-surface shadow-xl overflow-y-auto max-h-[calc(100vh-8rem)] md:block">
        <ProjectFilters
          members={members}
          defaultTimeFilter={activeTimeFilter}
          defaultStatusFilters={activeStatusFilters}
          defaultAssigneeFilters={activeAssigneeFilters}
          onTimeFilterChange={handleTimeFilterChange}
          onStatusFiltersChange={handleStatusFiltersChange}
          onAssigneeFiltersChange={handleAssigneeFiltersChange}
        />
      </div>

      {/* Floating + button — hidden while the drawer is open, creation is in progress, or user lacks admin role */}
      {!isCreating && !drawerOpen && hasMinRole(activeRole, "admin") && (
        <Button
          isIconOnly
          color="primary"
          radius="full"
          size="lg"
          onPress={handleAddClick}
          aria-label={t("map.addMapObject")}
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

      {/* Map hint — nudge the user to click the map when in pin placement mode */}
      {step === "pin" && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-gray-900/80 px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <span className="text-sm text-white">{t("map.tapToSetLocation")}</span>
        </div>
      )}
    </div>
  );
}
