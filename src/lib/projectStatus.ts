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
  1: "Ongoing",
  2: "Blocked",
  3: "Done",
  4: "Cancelled",
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
  0: { description: "New job",  iconColor: "text-slate-600",   border: "border-slate-400",   bg: "bg-slate-50"   },
  1: { description: "Work ongoing",    iconColor: "text-blue-500",    border: "border-blue-400",    bg: "bg-blue-50"    },
  2: { description: "Work blocked",  iconColor: "text-amber-500",  border: "border-amber-400",  bg: "bg-amber-50"  },
  3: { description: "Job is done", iconColor: "text-green-500",   border: "border-green-400",   bg: "bg-green-50"   },
  4: { description: "Job was cancelled",   iconColor: "text-red-600", border: "border-red-400", bg: "bg-red-50" },
};

/** Solid hex colours used for map pin rendering (matches STATUS_META iconColor). */
export const STATUS_SOLID_COLORS: Record<number, string> = {
  0: "#475569", // slate-600
  1: "#3b82f6", // blue-500
  2: "#f59e0b", // amber-500
  3: "#16a34a", // green-500
  4: "#dc2626", // red-600
};

/** SVG path `d` attribute for each status icon (Heroicons outline, 24×24 viewBox). */
export const STATUS_ICON_PATHS: Record<number, string> = {
  0: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5",
  1: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  2: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  3: "M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5",
  4: "M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

export const PROJECT_STATUSES = Object.entries(STATUS_LABELS).map(([key, label]) => ({
  value: Number(key) as ProjectStatus,
  label,
}));

export type ProjectStatus = 0 | 1 | 2 | 3 | 4;
