"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";

import { PROJECT_STATUSES } from "@/context/NewProjectContext";
import { useOrg } from "@/context/OrgContext";
import { useDrawer } from "@/context/DrawerContext";
import { useNewProject } from "@/context/NewProjectContext";
import { getProjectAssignees } from "@/lib/members";
import CreateProjectForm from "@/components/CreateProjectForm";
import type { Project } from "@/lib/supabase";

interface Props {
  project: Project;
  onEditClose?: () => void;
}

function statusLabel(value: number | null) {
  if (value === null) return "—";
  return PROJECT_STATUSES.find((s) => s.value === value)?.label ?? String(value);
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
    { label: "Status", value: statusLabel(project.project_status) },
    { label: "Start time", value: formatDateTime(project.start_time) },
    { label: "Created", value: formatDateTime(project.created_at) },
  ];

  return (
    <div className="flex flex-col gap-4">
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
