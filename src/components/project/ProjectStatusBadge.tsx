"use client";

import type { ReactNode } from "react";
import type { ProjectStatus } from "@/context/NewProjectContext";

export interface StatusMeta {
  description: string;
  iconColor: string;
  border: string;
  bg: string;
}

export const STATUS_META: Record<number, StatusMeta> = {
  0: { description: "New opportunity",  iconColor: "text-slate-600",   border: "border-slate-400",   bg: "bg-slate-50"   },
  1: { description: "Proposal sent",    iconColor: "text-blue-500",    border: "border-blue-400",    bg: "bg-blue-50"    },
  2: { description: "Contract agreed",  iconColor: "text-violet-600",  border: "border-violet-400",  bg: "bg-violet-50"  },
  3: { description: "Work in progress", iconColor: "text-amber-500",   border: "border-amber-400",   bg: "bg-amber-50"   },
  4: { description: "Work completed",   iconColor: "text-emerald-600", border: "border-emerald-400", bg: "bg-emerald-50" },
  5: { description: "Awaiting payment", iconColor: "text-orange-500",  border: "border-orange-400",  bg: "bg-orange-50"  },
  6: { description: "Payment received", iconColor: "text-green-600",   border: "border-green-500",   bg: "bg-green-50"   },
};

export const STATUS_ICONS: Record<number, ReactNode> = {
  // Lead — magnifying glass
  0: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"/>
    </svg>
  ),
  // Offered — paper airplane
  1: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  // Accepted — check circle
  2: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  ),
  // Ongoing — clock
  3: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  ),
  // Done — flag
  4: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  ),
  // Invoicing — credit card
  5: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75zM2.25 8.25h19.5M5.25 14.25h6M5.25 16.5h3"/>
    </svg>
  ),
  // Paid — currency dollar in circle
  6: (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  ),
};

export const STATUS_LABELS: Record<number, string> = {
  0: "Lead",
  1: "Offered",
  2: "Accepted",
  3: "Ongoing",
  4: "Done",
  5: "Invoicing",
  6: "Paid",
};

interface Props {
  status: ProjectStatus;
  /** Whether to show active/selected styling. Defaults to true when no onClick is given (display mode). */
  isSelected?: boolean;
  /** If provided, renders as an interactive button. */
  onClick?: () => void;
  isDisabled?: boolean;
  className?: string;
}

/**
 * A single status card. Works in two modes:
 * - Display mode (no onClick): always renders with active colouring, non-interactive.
 * - Interactive mode (onClick provided): renders as a button with hover/selected states.
 */
export default function ProjectStatusBadge({
  status,
  isSelected,
  onClick,
  isDisabled = false,
  className = "",
}: Props) {
  const meta = STATUS_META[status];
  const label = STATUS_LABELS[status];
  const interactive = onClick !== undefined;
  // In display mode default to always selected; in interactive mode use the prop
  const active = isSelected ?? !interactive;

  const base = "flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors";
  const stateClasses = active
    ? `${meta.border} ${meta.bg}`
    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50";
  const disabledClasses = isDisabled ? "cursor-not-allowed opacity-50" : interactive ? "cursor-pointer" : "";

  const content = (
    <>
      <span className={active ? meta.iconColor : "text-gray-400"}>
        {STATUS_ICONS[status]}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${active ? "text-gray-900" : "text-gray-600"}`}>
          {label}
        </p>
        <p className="truncate text-xs text-gray-400">{meta.description}</p>
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        disabled={isDisabled}
        onClick={onClick}
        className={[base, stateClasses, disabledClasses, className].filter(Boolean).join(" ")}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={[base, stateClasses, className].filter(Boolean).join(" ")}>
      {content}
    </div>
  );
}
