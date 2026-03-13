"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";

import { useOrg } from "@/context/OrgContext";
import { useDrawer } from "@/context/DrawerContext";
import { useNewProject } from "@/context/NewProjectContext";
import { getProjectAssignees } from "@/lib/members";
import CreateProjectForm from "@/components/CreateProjectForm";
import ProjectStatusBadge from "@/components/ProjectStatusBadge";
import type { Project } from "@/lib/supabase";
import type { ProjectStatus } from "@/context/NewProjectContext";

interface Props {
  project: Project;
  onEditClose?: () => void;
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

  const fields = [
    { label: "Description", value: project.description || "—" },
    { label: "Estimated time", value: project.estimated_time != null ? `${project.estimated_time} h` : "—" },
    { label: "Start time", value: formatDateTime(project.start_time) },
    { label: "Created", value: formatDateTime(project.created_at) },
  ];

  return (
    <div className="flex flex-col gap-4">
      {project.project_status != null && (
        <ProjectStatusBadge status={project.project_status as ProjectStatus} />
      )}
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-0.5 text-sm text-gray-800">{value}</p>
        </div>
      ))}

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Assignees</p>
        {assigneeData.length === 0 ? (
          <p className="mt-0.5 text-sm text-gray-400">None</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {assigneeData.map(({ id, name }) => (
              <li key={id} className="text-sm text-gray-800">
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {activeRole === "admin" && (
        <Button color="primary" variant="flat" onPress={handleEditClick} fullWidth>
          Edit Project
        </Button>
      )}
    </div>
  );
}
