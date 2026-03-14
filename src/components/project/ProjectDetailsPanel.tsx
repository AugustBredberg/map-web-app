"use client";

import { useEffect, useState } from "react";
import { Button, Chip } from "@heroui/react";

import { useOrg } from "@/context/OrgContext";
import { useDrawer } from "@/context/DrawerContext";
import { useNewProject } from "@/context/NewProjectContext";
import { getProjectAssignees } from "@/lib/members";
import CreateProjectForm from "@/components/project/CreateProjectForm";
import ProjectStatusBadge from "@/components/project/ProjectStatusBadge";
import type { Project } from "@/lib/supabase";
import { hasMinRole } from "@/lib/supabase";
import type { ProjectStatus } from "@/context/NewProjectContext";

interface Props {
  project: Project;
  onEditClose?: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatCreated(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ProjectDetailsPanel({ project, onEditClose }: Props) {
  const [assigneeData, setAssigneeData] = useState<{ id: string; name: string }[]>([]);
  const { activeRole } = useOrg();
  const { openDrawer } = useDrawer();
  const { startEditing, cancelEditing } = useNewProject();

  useEffect(() => {
    let cancelled = false;
    getProjectAssignees(project.project_id).then(({ data }) => {
      if (!cancelled && data) setAssigneeData(data);
    });
    return () => { cancelled = true; };
  }, [project.project_id]);

  const handleEditClick = () => {
    startEditing(project, assigneeData.map((a) => a.id));
    openDrawer(<CreateProjectForm mode="edit" />, {
      title: "Edit Project",
      backdrop: false,
      onClose: () => {
        cancelEditing();
        onEditClose?.();
      },
    });
  };

  const startDate = formatDate(project.start_time);
  const startTime = formatTime(project.start_time);
  const estimatedEnd =
    project.start_time && project.estimated_time != null
      ? formatTime(new Date(new Date(project.start_time).getTime() + project.estimated_time * 3600000).toISOString())
      : null;

  return (
    <div className="flex flex-col gap-5">

      {/* Status */}
      {project.project_status != null && (
        <ProjectStatusBadge status={project.project_status as ProjectStatus} />
      )}
      

      {/* Schedule */}
      <div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 mt-4 flex flex-col gap-1.5">
          {startDate ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-gray-800">{startDate}</span>
              </div>
              {startTime && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {startTime}
                    {estimatedEnd && <span className="text-gray-400"> → {estimatedEnd}</span>}
                    {project.estimated_time != null && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {project.estimated_time} h
                      </span>
                    )}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">No start time set</p>
          )}
        </div>
      </div>

      {/* Assignees */}
      <div>
        <p className="mb-2 uppercase tracking-widest ">Assigned to</p>
        {assigneeData.length === 0 ? (
          <p className="text-sm text-gray-400">Unassigned</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assigneeData.map(({ id, name }) => (
              <Chip key={id} size="md" color="primary" variant="faded">{name}</Chip>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">Description</p>
          <p className="text-sm leading-relaxed text-gray-700">{project.description}</p>
        </div>
      )}

      {/* Edit button */}
      {hasMinRole(activeRole, "admin") && (
        <Button color="primary" variant="flat" onPress={handleEditClick} fullWidth>
          Edit Project
        </Button>
      )}

      {/* Created — de-emphasised footnote */}
      <p className="text-center text-xs text-gray-300">Created {formatCreated(project.created_at)}</p>

    </div>
  );
}
