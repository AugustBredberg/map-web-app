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
  0: "Lead",
  1: "Offered",
  2: "Accepted",
  3: "Ongoing",
  4: "Done",
  5: "Invoicing",
  6: "Paid",
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
  0: { description: "New opportunity",  iconColor: "text-slate-600",   border: "border-slate-400",   bg: "bg-slate-50"   },
  1: { description: "Proposal sent",    iconColor: "text-blue-500",    border: "border-blue-400",    bg: "bg-blue-50"    },
  2: { description: "Contract agreed",  iconColor: "text-violet-600",  border: "border-violet-400",  bg: "bg-violet-50"  },
  3: { description: "Work in progress", iconColor: "text-amber-500",   border: "border-amber-400",   bg: "bg-amber-50"   },
  4: { description: "Work completed",   iconColor: "text-emerald-600", border: "border-emerald-400", bg: "bg-emerald-50" },
  5: { description: "Awaiting payment", iconColor: "text-orange-500",  border: "border-orange-400",  bg: "bg-orange-50"  },
  6: { description: "Payment received", iconColor: "text-green-600",   border: "border-green-500",   bg: "bg-green-50"   },
};

/** Solid hex colours used for map pin rendering (matches STATUS_META iconColor). */
export const STATUS_SOLID_COLORS: Record<number, string> = {
  0: "#475569", // slate-600
  1: "#3b82f6", // blue-500
  2: "#7c3aed", // violet-600
  3: "#f59e0b", // amber-500
  4: "#059669", // emerald-600
  5: "#f97316", // orange-500
  6: "#16a34a", // green-600
};

/** SVG path `d` attribute for each status icon (Heroicons outline, 24×24 viewBox). */
export const STATUS_ICON_PATHS: Record<number, string> = {
  0: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z",
  1: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5",
  2: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  3: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  4: "M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5",
  5: "M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75zM2.25 8.25h19.5M5.25 14.25h6M5.25 16.5h3",
  6: "M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

export const PROJECT_STATUSES = Object.entries(STATUS_LABELS).map(([key, label]) => ({
  value: Number(key) as ProjectStatus,
  label,
}));

export type ProjectStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
