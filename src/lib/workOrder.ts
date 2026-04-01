import type { Project } from "@/lib/supabase";
import { compareProjectsDispatchOrder, isProjectScheduleTerminal } from "@/lib/projectSchedule";

/** Status groups for the installer /work queue (excludes Done and Cancelled). */
const ONGOING: number = 3;
const BLOCKED: number = 4;
const UP_NEXT_STATUSES = new Set([0, 1, 2]);

export type WorkProjectSections = {
  ongoing: Project[];
  upNext: Project[];
  blocked: Project[];
};

/**
 * Partitions assigned jobs for the field workflow: ongoing first, then jobs not yet in progress
 * (new / customer visit / ready) by dispatch order, then blocked.
 */
export function partitionWorkProjects(projects: Project[], now: Date = new Date()): WorkProjectSections {
  const active = projects.filter((p) => !isProjectScheduleTerminal(p.project_status));

  const sortByDispatch = (a: Project, b: Project) => compareProjectsDispatchOrder(a, b, now);

  const ongoing = active.filter((p) => p.project_status === ONGOING).sort(sortByDispatch);

  const upNext = active
    .filter((p) => UP_NEXT_STATUSES.has(p.project_status ?? -1))
    .sort(sortByDispatch);

  const blocked = active.filter((p) => p.project_status === BLOCKED).sort(sortByDispatch);

  return { ongoing, upNext, blocked };
}
