"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PROJECT_STATUSES } from "@/context/NewProjectContext";
import type { Project } from "@/lib/supabase";

interface Props {
  project: Project;
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

export default function ProjectDetailsPanel({ project }: Props) {
  const [assignees, setAssignees] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("project_assignees")
      .select("user_id")
      .eq("project_id", project.project_id)
      .then(async ({ data: assigneeRows }) => {
        if (cancelled) return;
        if (!assigneeRows || assigneeRows.length === 0) return;
        const userIds = assigneeRows.map((r) => r.user_id as string);
        const { data: memberRows } = await supabase
          .from("organization_members")
          .select("user_id, display_name")
          .in("user_id", userIds);
        if (!cancelled && memberRows) {
          setAssignees(memberRows.map((m) => (m.display_name as string | null) ?? m.user_id));
        }
      });

    return () => { cancelled = true; };
  }, [project.project_id]);

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
        {assignees.length === 0 ? (
          <p className="mt-0.5 text-sm text-gray-400">None</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {assignees.map((name) => (
              <li key={name} className="text-sm text-gray-800">
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
