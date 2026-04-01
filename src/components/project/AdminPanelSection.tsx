"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  /** Optional right-aligned actions (e.g. edit). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Section chrome for admin job panels — matches /work cards: surface, single border, no grey header strip.
 */
export default function AdminPanelSection({ title, actions, children, className = "" }: Props) {
  return (
    <section className={`rounded-xl border border-border bg-surface p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
