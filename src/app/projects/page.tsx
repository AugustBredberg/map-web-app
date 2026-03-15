"use client";

import { useState, useCallback } from "react";
import { Button } from "@heroui/react";
import NavMenu from "@/components/NavMenu";
import ProjectFilters from "@/components/project/ProjectFilters";
import ProjectList from "@/components/project/ProjectList";
import ProjectDetailsPanel from "@/components/project/ProjectDetailsPanel";
import { useDrawer } from "@/context/DrawerContext";
import type { Project } from "@/lib/supabase";

const EMPTY_PROJECTS: Project[] = [];

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { openDrawer } = useDrawer();

  const openFiltersDrawer = useCallback(() => {
    openDrawer(<ProjectFilters />, { title: "Filters", backdrop: true });
  }, [openDrawer]);

  return (
    <NavMenu>
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Filters sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-52 shrink-0 border-r border-gray-200 overflow-y-auto">
          <ProjectFilters />
        </aside>

        {/* Project list column */}
        <div
          className={`flex flex-col shrink-0 border-r border-gray-200 overflow-hidden ${
            selectedProject ? "hidden md:flex md:w-80" : "flex-1 md:flex-none md:w-80"
          }`}
        >
          {/* Mobile: top bar with filter button */}
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 md:hidden">
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={openFiltersDrawer}
              aria-label="Open filters"
            >
              <FilterIcon />
            </Button>
            <span className="text-sm font-semibold text-gray-700">Projects</span>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto">
            <ProjectList
              projects={EMPTY_PROJECTS}
              selectedProjectId={selectedProject?.project_id ?? null}
              onSelect={setSelectedProject}
            />
          </div>
        </div>

        {/* Project details */}
        {selectedProject ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Mobile: back button */}
            <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 md:hidden">
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                onPress={() => setSelectedProject(null)}
                aria-label="Back to list"
              >
                <BackIcon />
              </Button>
              <span className="truncate text-sm font-semibold text-gray-700">
                {selectedProject.title}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <ProjectDetailsPanel project={selectedProject} />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-sm text-gray-400">
            Select a project to view details
          </div>
        )}
      </div>
    </NavMenu>
  );
}
