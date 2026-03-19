"use client";

import { useState, useCallback, useMemo } from "react";
import { Chip } from "@heroui/react";
import type { OrganizationMember } from "@/lib/supabase";
import { STATUS_LABELS, STATUS_ICON_PATHS } from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";

const TIME_FILTER_ICONS = {
  today: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  all: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
} as const;

const STATUS_ICONS_FILTER = Object.entries(STATUS_LABELS).map(([id]) => ({
  id,
  icon: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d={STATUS_ICON_PATHS[Number(id)]} />
    </svg>
  ),
}));

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface Props {
  members?: OrganizationMember[];
  defaultTimeFilter?: string | null;
  defaultStatusFilters?: Set<string>;
  defaultAssigneeFilters?: Set<string>;
  onTimeFilterChange: (id: string | null) => void;
  onStatusFiltersChange: (filters: Set<string>) => void;
  onAssigneeFiltersChange: (filters: Set<string>) => void;
}

export default function ProjectFilters({
  members = [],
  defaultTimeFilter = "all",
  defaultStatusFilters,
  defaultAssigneeFilters,
  onTimeFilterChange,
  onStatusFiltersChange,
  onAssigneeFiltersChange,
}: Props) {
  const { t } = useLocale();

  const TIME_FILTERS = useMemo(() => [
    { id: "today", label: t("filters.todaysJobs"), icon: TIME_FILTER_ICONS.today },
    { id: "all",   label: t("filters.allJobs"),   icon: TIME_FILTER_ICONS.all   },
  ], [t]);

  const STATUS_FILTERS = useMemo(() => STATUS_ICONS_FILTER.map(({ id, icon }) => ({
    id,
    label: t(`statusLabels.${id}`),
    icon,
  })), [t]);

  const statusFilterCount = STATUS_ICONS_FILTER.length;
  const [timeOpen, setTimeOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [activeTimeFilter, setActiveTimeFilter] = useState<string | null>(defaultTimeFilter);
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<string>>(
    defaultStatusFilters ?? new Set(),
  );
  const [activeAssigneeFilters, setActiveAssigneeFilters] = useState<Set<string>>(
    defaultAssigneeFilters ?? new Set(),
  );

  const handleTimeFilter = useCallback((id: string) => {
    const next = activeTimeFilter === id ? null : id;
    setActiveTimeFilter(next);
    onTimeFilterChange(next);
  }, [activeTimeFilter, onTimeFilterChange]);

  const handleStatusFilter = useCallback((id: string) => {
    const next = new Set(activeStatusFilters);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    setActiveStatusFilters(next);
    onStatusFiltersChange(next);
  }, [activeStatusFilters, onStatusFiltersChange]);

  const handleSelectAllStatuses = useCallback(() => {
    const next =
      activeStatusFilters.size === statusFilterCount
        ? new Set<string>()
        : new Set(STATUS_ICONS_FILTER.map((f) => f.id));
    setActiveStatusFilters(next);
    onStatusFiltersChange(next);
  }, [activeStatusFilters, onStatusFiltersChange, statusFilterCount]);

  const handleAssigneeFilter = useCallback((userId: string) => {
    const next = new Set(activeAssigneeFilters);
    if (next.has(userId)) { next.delete(userId); } else { next.add(userId); }
    setActiveAssigneeFilters(next);
    onAssigneeFiltersChange(next);
  }, [activeAssigneeFilters, onAssigneeFiltersChange]);

  return (
    <div className="flex flex-col">

      <div className="flex flex-col p-2 gap-1">
        {/* Tid & Idag */}
        <div>
          <button
            className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:bg-muted-bg"
            onClick={() => setTimeOpen((v) => !v)}
          >
            <ChevronIcon open={timeOpen} />
             {t("filters.jobFilter")}
          </button>
          {timeOpen && (
            <ul className="mt-0.5 ml-3">
              {TIME_FILTERS.map(({ id, label, icon }) => (
                <li key={id}>
                  <button
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      activeTimeFilter === id
                        ? "bg-selected font-medium text-foreground"
                        : "text-foreground hover:bg-muted-bg"
                    }`}
                    onClick={() => handleTimeFilter(id)}
                  >
                    <span className={activeTimeFilter === id ? "text-foreground" : "text-muted"}>
                      {icon}
                    </span>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Status — only relevant when viewing all jobs */}
        {activeTimeFilter === "all" && <div>
          <div className="flex items-center">
            <button
              className="flex flex-1 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:bg-muted-bg"
              onClick={() => setStatusOpen((v) => !v)}
            >
              <ChevronIcon open={statusOpen} />
              {t("filters.status")}
            </button>
            <button
              className="cursor-pointer rounded-md px-2 py-1 text-xs text-muted hover:bg-muted-bg hover:text-foreground"
              onClick={handleSelectAllStatuses}
            >
              {activeStatusFilters.size === statusFilterCount ? t("filters.clear") : t("filters.all")}
            </button>
          </div>
          {statusOpen && (
            <ul className="mt-0.5 ml-3">
              {STATUS_FILTERS.map(({ id, label, icon }) => (
                <li key={id}>
                  <button
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      activeStatusFilters.has(id)
                        ? "bg-selected font-medium text-foreground"
                        : "text-foreground hover:bg-muted-bg"
                    }`}
                    onClick={() => handleStatusFilter(id)}
                  >
                    <span className={activeStatusFilters.has(id) ? "text-foreground" : "text-muted"}>
                      {icon}
                    </span>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>}

        {/* Personer */}
        <div>
          <button
            className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:bg-muted-bg"
            onClick={() => setPeopleOpen((v) => !v)}
          >
            <ChevronIcon open={peopleOpen} />
            {t("filters.people")}
          </button>
          {peopleOpen && (
            members.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted">{t("filters.noMembers")}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 px-2 py-1.5">
                {members.map((m) => {
                  const selected = activeAssigneeFilters.has(m.user_id);
                  return (
                    <Chip
                      key={m.user_id}
                      size="sm"
                      variant={selected ? "flat" : "bordered"}
                      color={selected ? "primary" : "default"}
                      className="cursor-pointer select-none"
                      onClick={() => handleAssigneeFilter(m.user_id)}
                    >
                      {m.display_name ?? m.user_id}
                    </Chip>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
