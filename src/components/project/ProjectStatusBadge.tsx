"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  type ProjectStatus,
  type StatusMeta,
  STATUS_META,
  STATUS_ICON_PATHS,
  STATUS_LABELS,
  STATUS_SOLID_COLORS,
} from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";
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
  /** Field / installer: one-line row; display mode is visually distinct from transition actions. */
  compact?: boolean;
}

function labelMatchesDescription(label: string, description: string): boolean {
  const n = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return n(label) === n(description);
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
  compact = false,
}: Props) {
  const meta = STATUS_META[status];
  const { t } = useLocale();
  const label = t(`statusLabels.${status}`);
  const description = t(`statusDescriptions.${status}`);
  const interactive = onClick !== undefined;
  // In display mode default to always selected; in interactive mode use the prop
  const active = isSelected ?? !interactive;
  const showSubtitle = !compact && !labelMatchesDescription(label, description);

  const accent = STATUS_SOLID_COLORS[status] ?? "#64748b";

  const compactDisplayClass =
    compact && !interactive
      ? "flex items-center gap-2.5 rounded-lg border border-transparent bg-muted-bg/70 px-3 py-2.5 text-left ring-1 ring-inset ring-border/50"
      : null;

  const base = compact
    ? interactive
      ? "flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors border-l-[4px]"
      : (compactDisplayClass ?? "")
    : "flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors";
  const stateClasses = compact
    ? ""
    : active
      ? `${meta.border} ${meta.bg}`
      : "border-border bg-surface hover:border-border hover:bg-muted-bg";
  const disabledClasses = isDisabled ? "cursor-not-allowed opacity-50" : interactive ? "cursor-pointer" : "";

  const content = (
    <>
      {!compact || interactive ? (
        <span className={compact ? "text-muted" : active ? meta.iconColor : "text-muted"}>{STATUS_ICONS[status]}</span>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface shadow-inner ring-1 ring-border/60">
          <span className="[&_svg]:h-5 [&_svg]:w-5" style={{ color: accent }}>
            {STATUS_ICONS[status]}
          </span>
        </span>
      )}
      <div className="min-w-0">
        <p
          className={`text-sm leading-tight ${
            compact && !interactive
              ? "font-medium text-foreground"
              : compact
                ? "font-semibold text-foreground"
                : active
                  ? "font-semibold text-foreground"
                  : "font-semibold text-muted"
          }`}
        >
          {label}
        </p>
        {showSubtitle ? <p className="truncate text-xs text-muted">{description}</p> : null}
      </div>
    </>
  );

  const style: CSSProperties | undefined = compact && interactive ? { borderLeftColor: accent } : undefined;

  if (interactive) {
    return (
      <button
        type="button"
        disabled={isDisabled}
        onClick={onClick}
        style={style}
        className={[base, stateClasses, disabledClasses, className].filter(Boolean).join(" ")}
      >
        {content}
      </button>
    );
  }

  return (
    <div role="status" style={style} className={[base, stateClasses, className].filter(Boolean).join(" ")}>
      {content}
    </div>
  );
}

