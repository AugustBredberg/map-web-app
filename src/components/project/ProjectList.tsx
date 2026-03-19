"use client";

import { useState } from "react";
import type { Project } from "@/lib/supabase";
import { STATUS_SOLID_COLORS } from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n";

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

const LOCALE_CODE: Record<Locale, string> = { en: "en-GB", sv: "sv-SE" };

function formatListDate(iso: string | null, locale: Locale) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(LOCALE_CODE[locale], {
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
  const { t, locale } = useLocale();

  const sorted = [...projects].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortDir === "desc" ? tb - ta : ta - tb;
  });

  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12 text-center">
        <p className="text-sm text-muted">{t("projects.noProjects")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sort bar */}
      <div className="flex items-center justify-end px-3 py-1.5">
        <button
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-muted-bg hover:text-foreground"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          aria-label={sortDir === "desc" ? t("projects.sortAscending") : t("projects.sortDescending")}
        >
          <SortIcon dir={sortDir} />
          {sortDir === "desc" ? t("projects.newestFirst") : t("projects.oldestFirst")}
        </button>
      </div>
      <ul className="flex flex-col gap-2 p-2">
        {sorted.map((project) => {
        const isSelected = project.project_id === selectedProjectId;
        const date = formatListDate(project.start_time, locale);

        return (
          <li key={project.project_id}>
            <button
              className={`flex w-full cursor-pointer items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                isSelected ? "bg-selected" : "bg-surface hover:bg-selected/60"
              }`}
              onClick={() => onSelect(project)}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold text-foreground`}
                >
                  {project.title}
                </p>
                {project.description && (
                  <p className="mt-0.5 truncate text-xs text-muted">
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
                  <span className="text-xs text-muted">{date}</span>
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
