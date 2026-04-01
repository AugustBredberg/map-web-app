"use client";

import type { ReactNode } from "react";

interface Props {
  body: string;
  title: string;
  subtitle: string;
  headerRight?: ReactNode;
  /** `field` = high-visibility for installers; `admin` = neutral office UI. */
  variant?: "field" | "admin";
}

/**
 * Callout for job instructions — high-visibility in the field, restrained in admin views.
 */
export default function ProjectHighlightedInstructions({
  body,
  title,
  subtitle,
  headerRight,
  variant = "field",
}: Props) {
  if (variant === "admin") {
    return (
      <section
        className="rounded-xl border border-border bg-surface p-4"
        aria-labelledby="project-instructions-heading"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 id="project-instructions-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
              {title}
            </h3>
            <p className="mt-1 text-xs text-muted">{subtitle}</p>
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{body}</p>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-amber-50/95 p-4 shadow-sm ring-1 ring-amber-950/[0.04] dark:border-amber-700/55 dark:bg-amber-950 dark:ring-0"
      aria-labelledby="project-instructions-heading"
    >
      <div className="relative flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 gap-2">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm dark:bg-amber-600"
              aria-hidden
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <h3 id="project-instructions-heading" className="text-sm font-bold uppercase tracking-wide text-amber-950 dark:text-amber-200">
                {title}
              </h3>
              <p className="text-xs font-medium text-amber-800/90 dark:text-amber-400/95">{subtitle}</p>
            </div>
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
        <p className="whitespace-pre-wrap pl-[2.75rem] text-base font-medium leading-relaxed text-amber-950 dark:text-amber-100">
          {body}
        </p>
      </div>
    </section>
  );
}
