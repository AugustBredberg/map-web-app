"use client";

import type { Project } from "@/lib/supabase";

function formatListDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function statusDotColor(status: number | null): string {
  switch (status) {
    case 0: return "bg-slate-400";
    case 1: return "bg-blue-500";
    case 2: return "bg-violet-500";
    case 3: return "bg-amber-500";
    case 4: return "bg-emerald-500";
    case 5: return "bg-orange-500";
    case 6: return "bg-green-500";
    default: return "bg-gray-300";
  }
}

interface Props {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (project: Project) => void;
}

export default function ProjectList({ projects, selectedProjectId, onSelect }: Props) {
  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12 text-center">
        <p className="text-sm text-gray-400">No projects yet</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {projects.map((project) => {
        const isSelected = project.project_id === selectedProjectId;
        const date = formatListDate(project.start_time);

        return (
          <li key={project.project_id}>
            <button
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                isSelected ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
              onClick={() => onSelect(project)}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold ${
                    isSelected ? "text-blue-700" : "text-gray-900"
                  }`}
                >
                  {project.title}
                </p>
                {project.description && (
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {project.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className={`mt-0.5 h-2.5 w-2.5 rounded-full ${statusDotColor(project.project_status)}`}
                />
                {date && (
                  <span className="text-xs text-gray-400">{date}</span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
