/**
 * Single source of truth for project status display data.
 * Imported by components, contexts, hooks — no React/JSX here.
 */

export interface StatusMeta {
  description: string;
  iconColor: string;
  border: string;
  bg: string;
}

export const STATUS_LABELS: Record<number, string> = {
  0: "New",
  1: "Customer Visit",
  2: "Ongoing",
  3: "Blocked",
  4: "Done",
  5: "Cancelled",
};

/*
Kanske att vi ska ändra statusarna till:
0 Lead          Sälj
1 Confirmed     Sälj
2 Scheduled     Arbetare
3 Ongoing       Arbetare
4 Done          Arbetare
5 Invoiced      Ekonomi
6 Paid          Ekonomi

*/

export const STATUS_META: Record<number, StatusMeta> = {
  0: { description: "New job",            iconColor: "text-slate-600 dark:text-slate-400",  border: "border-slate-400 dark:border-slate-600",  bg: "bg-slate-50 dark:bg-slate-800/50"  },
  1: { description: "Customer visit",     iconColor: "text-violet-500 dark:text-violet-400", border: "border-violet-400 dark:border-violet-600", bg: "bg-violet-50 dark:bg-violet-900/30" },
  2: { description: "Work ongoing",       iconColor: "text-blue-500 dark:text-blue-400",     border: "border-blue-400 dark:border-blue-600",     bg: "bg-blue-50 dark:bg-blue-900/30"   },
  3: { description: "Work blocked",       iconColor: "text-amber-500 dark:text-amber-400",   border: "border-amber-400 dark:border-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/30"  },
  4: { description: "Job is done",        iconColor: "text-green-500 dark:text-green-400",   border: "border-green-400 dark:border-green-600",   bg: "bg-green-50 dark:bg-green-900/30"  },
  5: { description: "Job was cancelled",  iconColor: "text-red-600 dark:text-red-400",       border: "border-red-400 dark:border-red-600",       bg: "bg-red-50 dark:bg-red-900/30"    },
};

/** Solid hex colours used for map pin rendering (matches STATUS_META iconColor). */
export const STATUS_SOLID_COLORS: Record<number, string> = {
  0: "#475569", // slate-600
  1: "#8b5cf6", // violet-500
  2: "#3b82f6", // blue-500
  3: "#f59e0b", // amber-500
  4: "#16a34a", // green-500
  5: "#dc2626", // red-600
};

/** SVG path `d` attribute for each status icon (Heroicons outline, 24×24 viewBox). */
export const STATUS_ICON_PATHS: Record<number, string> = {
  0: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5",
  1: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  2: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  3: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  4: "M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5",
  5: "M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

export const PROJECT_STATUSES = Object.entries(STATUS_LABELS).map(([key, label]) => ({
  value: Number(key) as ProjectStatus,
  label,
}));

export type ProjectStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface StatusTransition {
  to: ProjectStatus;
  /** Translation key for the call-to-action label (looked up via i18n statusTransitions.*) */
  labelKey: string;
  /** Primary transitions are shown as large prominent buttons */
  primary: boolean;
  color: "primary" | "success" | "warning" | "default";
}

/**
 * Allowed status transitions from each state.
 * States with no entry (Done=4) have no outgoing transitions.
 */
export const STATUS_TRANSITIONS: Partial<Record<ProjectStatus, StatusTransition[]>> = {
  0: [
    { to: 1, labelKey: "startCustomerVisit", primary: true,  color: "primary"  },
    { to: 2, labelKey: "startWork",          primary: true,  color: "primary"  },
  ],
  1: [
    { to: 2, labelKey: "startWork",          primary: true,  color: "primary"  },
  ],
  2: [
    { to: 4, labelKey: "completeJob",        primary: true,  color: "success"  },
    { to: 3, labelKey: "reportBlockage",     primary: false, color: "warning"  },
  ],
  3: [
    { to: 2, labelKey: "resumeWork",         primary: true,  color: "primary"  },
  ],
  4: [],
  5: [
    { to: 0, labelKey: "reopenJob",          primary: true,  color: "default"  },
  ],
};
