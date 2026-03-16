"use client";

import { useState, useCallback } from "react";
import { Chip } from "@heroui/react";
import type { OrganizationMember } from "@/lib/supabase";

const TIME_FILTERS = [
  {
    id: "today",
    label: "Dagens jobb",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    id: "all",
    label: "Alla jobb",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
//   {
//     id: "completed",
//     label: "Avslutade",
//     icon: (
//       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//       </svg>
//     ),
//   },
];

const STATUS_FILTERS = [
  {
    id: "0",
    label: "Lead",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
      </svg>
    ),
  },
  {
    id: "1",
    label: "Offered",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
  },
  {
    id: "2",
    label: "Accepted",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
  {
    id: "3",
    label: "Ongoing",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
  {
    id: "4",
    label: "Done",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
    ),
  },
  {
    id: "5",
    label: "Invoicing",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75zM2.25 8.25h19.5M5.25 14.25h6M5.25 16.5h3" />
      </svg>
    ),
  },
  {
    id: "6",
    label: "Paid",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
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
      activeStatusFilters.size === STATUS_FILTERS.length
        ? new Set<string>()
        : new Set(STATUS_FILTERS.map((f) => f.id));
    setActiveStatusFilters(next);
    onStatusFiltersChange(next);
  }, [activeStatusFilters, onStatusFiltersChange]);

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
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-100"
            onClick={() => setTimeOpen((v) => !v)}
          >
            <ChevronIcon open={timeOpen} />
             Jobbfilter
          </button>
          {timeOpen && (
            <ul className="mt-0.5">
              {TIME_FILTERS.map(({ id, label, icon }) => (
                <li key={id}>
                  <button
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      activeTimeFilter === id
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTimeFilter(id)}
                  >
                    <span className={activeTimeFilter === id ? "text-blue-500" : "text-gray-400"}>
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
              className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-100"
              onClick={() => setStatusOpen((v) => !v)}
            >
              <ChevronIcon open={statusOpen} />
              Status
            </button>
            <button
              className="rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={handleSelectAllStatuses}
            >
              {activeStatusFilters.size === STATUS_FILTERS.length ? "Clear" : "All"}
            </button>
          </div>
          {statusOpen && (
            <ul className="mt-0.5">
              {STATUS_FILTERS.map(({ id, label, icon }) => (
                <li key={id}>
                  <button
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      activeStatusFilters.has(id)
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleStatusFilter(id)}
                  >
                    <span className={activeStatusFilters.has(id) ? "text-blue-500" : "text-gray-400"}>
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
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-100"
            onClick={() => setPeopleOpen((v) => !v)}
          >
            <ChevronIcon open={peopleOpen} />
            Personer
          </button>
          {peopleOpen && (
            members.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">No members</p>
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
