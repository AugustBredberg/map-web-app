"use client";

import { useState } from "react";
import type { Project } from "@/lib/supabase";
import { STATUS_SOLID_COLORS } from "@/lib/projectStatus";

type SortDir = "desc" | "asc";

function SortIcon({ dir }: { dir: SortDir }) {
  return dir === "desc" ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10 4l-4 4m0 0l-4-4m4 4V8" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-4l-4-4m0 0l-4 4m4-4V16" />
    </svg>
  );
}

function formatListDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

interface Props {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (project: Project) => void;
}

export default function ProjectList({ projects, selectedProjectId, onSelect }: Props) {
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = [...projects].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortDir === "desc" ? tb - ta : ta - tb;
  });

  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12 text-center">
        <p className="text-sm text-gray-400">No projects yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sort bar */}
      <div className="flex items-center justify-end border-b border-gray-100 px-3 py-1.5">
        <button
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          aria-label={`Sort ${sortDir === "desc" ? "ascending" : "descending"}`}
        >
          <SortIcon dir={sortDir} />
          {sortDir === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>
      <ul className="divide-y divide-gray-100">
        {sorted.map((project) => {
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
                  className="mt-0.5 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_SOLID_COLORS[project.project_status ?? -1] ?? "#d1d5db" }}
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
    </div>
  );
}
