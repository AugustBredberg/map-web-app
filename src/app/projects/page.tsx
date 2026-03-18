"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Spinner } from "@heroui/react";
import NavMenu from "@/components/NavMenu";
import ProjectFilters from "@/components/project/ProjectFilters";
import ProjectList from "@/components/project/ProjectList";
import ProjectDetailsPanel from "@/components/project/ProjectDetailsPanel";
import CreateProjectForm from "@/components/project/CreateProjectForm";
import { useDrawer } from "@/context/DrawerContext";
import { useOrg } from "@/context/OrgContext";
import { useNewProject } from "@/context/NewProjectContext";
import { fetchProjects } from "@/lib/projects";
import type { ProjectFetchFilters } from "@/lib/projects";
import { getOrgMembers } from "@/lib/members";
import type { Project, OrganizationMember } from "@/lib/supabase";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [activeTimeFilter, setActiveTimeFilter] = useState<string | null>("all");
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<string>>(new Set());
  const [activeAssigneeFilters, setActiveAssigneeFilters] = useState<Set<string>>(new Set());
  const { openDrawer } = useDrawer();
  const { activeOrg } = useOrg();
  const { startCreating, cancelCreating } = useNewProject();

  const handleNewProject = useCallback(() => {
    startCreating();
    openDrawer(<CreateProjectForm />, {
      title: "New Project",
      backdrop: false,
      onClose: cancelCreating,
    });
  }, [openDrawer, startCreating, cancelCreating]);

  const handleTimeFilterChange = useCallback((id: string | null) => {
    setActiveTimeFilter(id);
  }, []);

  const handleStatusFiltersChange = useCallback((filters: Set<string>) => {
    setActiveStatusFilters(filters);
  }, []);

  const handleAssigneeFiltersChange = useCallback((filters: Set<string>) => {
    setActiveAssigneeFilters(filters);
  }, []);

  useEffect(() => {
    if (!activeOrg) return;
    const load = async () => {
      setLoadingProjects(true);
      setProjectsError(null);
      const filters: ProjectFetchFilters = {
        timeFilter: activeTimeFilter as ProjectFetchFilters["timeFilter"],
        statusFilters: [...activeStatusFilters].map(Number),
        assigneeUserIds: [...activeAssigneeFilters],
      };
      const { data, error } = await fetchProjects(activeOrg.organization_id, filters);
      if (error) {
        setProjectsError(error);
        setProjects([]);
      } else {
        setProjects(data ?? []);
      }
      setLoadingProjects(false);
    };
    load();
  }, [activeOrg, activeTimeFilter, activeStatusFilters, activeAssigneeFilters]);

  useEffect(() => {
    if (!activeOrg) return;
    const load = async () => {
      const { data } = await getOrgMembers(activeOrg.organization_id);
      setMembers(data ?? []);
    };
    load();
  }, [activeOrg]);

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
      { title: "Filters", backdrop: true },
    );
  }, [openDrawer, members, activeTimeFilter, activeStatusFilters, activeAssigneeFilters, handleTimeFilterChange, handleStatusFiltersChange, handleAssigneeFiltersChange]);

  return (
    <NavMenu>
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Filters sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-52 shrink-0 border-r border-gray-200 overflow-y-auto">
          {/* New project button */}
          <div className="p-3 border-b border-gray-200">
            <Button
              color="primary"
              variant="flat"
              onPress={handleNewProject}
              fullWidth
              startContent={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              Nytt jobb
            </Button>
          </div>
          <ProjectFilters
            members={members}
            defaultTimeFilter={activeTimeFilter}
            defaultStatusFilters={activeStatusFilters}
            defaultAssigneeFilters={activeAssigneeFilters}
            onTimeFilterChange={handleTimeFilterChange}
            onStatusFiltersChange={handleStatusFiltersChange}
            onAssigneeFiltersChange={handleAssigneeFiltersChange}
          />
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
            {loadingProjects ? (
              <div className="flex h-full items-center justify-center py-12">
                <Spinner size="sm" />
              </div>
            ) : projectsError ? (
              <div className="flex h-full items-center justify-center px-6 py-12 text-center">
                <p className="text-sm text-red-500">{projectsError}</p>
              </div>
            ) : (
              <ProjectList
                projects={projects}
                selectedProjectId={selectedProject?.project_id ?? null}
                onSelect={setSelectedProject}
              />
            )}
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
