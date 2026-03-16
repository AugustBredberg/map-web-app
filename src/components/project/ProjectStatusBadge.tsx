"use client";

import type { ReactNode } from "react";
import {
  type ProjectStatus,
  type StatusMeta,
  STATUS_META,
  STATUS_ICON_PATHS,
  STATUS_LABELS,
} from "@/lib/projectStatus";
export type { StatusMeta, ProjectStatus };
export { STATUS_META, STATUS_ICON_PATHS, STATUS_LABELS };

export const STATUS_ICONS: Record<number, ReactNode> = Object.fromEntries(
  Object.entries(STATUS_ICON_PATHS).map(([key, d]): [string, ReactNode] => [
    key,
    <svg key={key} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>,
  ])
);

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

