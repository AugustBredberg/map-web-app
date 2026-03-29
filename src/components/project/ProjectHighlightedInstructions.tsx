"use client";

import type { ReactNode } from "react";

interface Props {
  body: string;
  title: string;
  subtitle: string;
  headerRight?: ReactNode;
}

/**
 * High-visibility callout for admin / customer instructions installers must see before working.
 */
export default function ProjectHighlightedInstructions({ body, title, subtitle, headerRight }: Props) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-50 via-amber-50/90 to-orange-50/80 p-4 shadow-sm dark:border-amber-500/50 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-orange-950/25"
      aria-labelledby="project-instructions-heading"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/20 dark:bg-amber-400/10"
        aria-hidden
      />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 gap-2">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm dark:bg-amber-600"
              aria-hidden
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <h3 id="project-instructions-heading" className="text-sm font-bold uppercase tracking-wide text-amber-950 dark:text-amber-100">
                {title}
              </h3>
              <p className="text-xs font-medium text-amber-800/90 dark:text-amber-200/80">{subtitle}</p>
            </div>
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
        <p className="whitespace-pre-wrap pl-[2.75rem] text-base font-medium leading-relaxed text-amber-950 dark:text-amber-50">
          {body}
        </p>
      </div>
    </section>
  );
}
