"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/react";
import PersonChip from "@/components/project/PersonChip";

import { getProjectAssignees } from "@/lib/members";
import { updateProjectStatus } from "@/lib/projects";
import ProjectAssigneeHoursLog from "@/components/project/ProjectAssigneeHoursLog";
import { useAuth } from "@/context/AuthContext";
import ProjectStatusBadge from "@/components/project/ProjectStatusBadge";
import ProjectStatusTransitions from "@/components/project/ProjectStatusTransitions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Project } from "@/lib/supabase";
import type { ProjectStatus } from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n";

interface Props {
  project: Project;
  onProjectUpdated?: (updated: Project) => void;
}

function formatDate(iso: string | null, locale: Locale) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale === "sv" ? "sv-SE" : "en-GB", { weekday: "short", month: "short", day: "numeric" });
}

function formatCreated(iso: string | null, locale: Locale) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale === "sv" ? "sv-SE" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default function ProjectDetailsPanel({ project, onProjectUpdated }: Props) {
  const { t, locale } = useLocale();
  const { session } = useAuth();
  const [assigneeState, setAssigneeState] = useState<{
    projectId: string;
    data: { id: string; name: string }[];
  } | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ProjectStatus>(
    (project.project_status ?? 0) as ProjectStatus,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProjectAssignees(project.project_id).then(({ data }) => {
      if (!cancelled) {
        setAssigneeState({ projectId: project.project_id, data: data ?? [] });
      }
    });
    return () => { cancelled = true; };
  }, [project.project_id]);

  // Loading until we have a response for the current project
  const assigneesLoading = assigneeState?.projectId !== project.project_id;
  const assigneeData = assigneesLoading ? [] : (assigneeState?.data ?? []);

  const handleTransition = useCallback(async (to: ProjectStatus) => {
    setIsTransitioning(true);
    setTransitionError(null);
    const { data, error } = await updateProjectStatus(project.project_id, to);
    setIsTransitioning(false);
    if (error || !data) {
      setTransitionError(error ?? t("projectDetails.failedToUpdateStatus"));
      return;
    }
    setCurrentStatus(to);
    onProjectUpdated?.(data);
  }, [project.project_id, onProjectUpdated, t]);

  const handleCancel = useCallback(async () => {
    setIsCancelling(true);
    const { data, error } = await updateProjectStatus(project.project_id, 6);
    setIsCancelling(false);
    setShowCancelConfirm(false);
    if (error || !data) {
      setTransitionError(error ?? t("projectDetails.failedToCancelProject"));
      return;
    }
    setCurrentStatus(6);
    onProjectUpdated?.(data);
  }, [project.project_id, onProjectUpdated, t]);

  const startDate = formatDate(project.start_time, locale);
  const isCancelled = currentStatus === 6;
  const isAssignee = !!session && assigneeData.some((a) => a.id === session.user.id);

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto">

      {/* Status badge */}
      <ProjectStatusBadge status={currentStatus} />

      {/* Status transitions */}
      <ProjectStatusTransitions
        currentStatus={currentStatus}
        onTransition={handleTransition}
        isLoading={isTransitioning}
      />

      {transitionError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{transitionError}</p>
      )}

      {/* Schedule */}
      <div className="rounded-xl border-border border-2 bg-surface px-4 py-3 flex flex-col gap-1.5">
        {startDate ? (
          <div className="flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-foreground">{startDate}</span>
          </div>
        ) : (
          <p className="text-sm text-muted">{t("projectDetails.noStartTime")}</p>
        )}
      </div>

      {/* Log worked hours */}
      {assigneesLoading ? (
        <div className="rounded-xl border-border border-2 bg-surface px-4 py-3 flex flex-col gap-3 animate-pulse">
          <div className="h-3 w-32 rounded bg-muted-bg" />
          <div className="flex justify-between items-center">
            <div className="h-4 w-4 rounded bg-muted-bg" />
            <div className="h-4 w-24 rounded bg-muted-bg" />
            <div className="h-4 w-4 rounded bg-muted-bg" />
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted-bg" />
            ))}
          </div>
          <div className="h-8 rounded-lg bg-muted-bg" />
        </div>
      ) : isAssignee && session ? (
        <ProjectAssigneeHoursLog
          projectId={project.project_id}
          userId={session.user.id}
          startTime={project.start_time}
        />
      ) : null}

      {/* Assignees */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{t("projectDetails.assignedTo")}</p>
        {assigneesLoading ? (
          <div className="flex flex-wrap gap-2 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-full bg-muted-bg" />
            ))}
          </div>
        ) : assigneeData.length === 0 ? (
          <p className="text-sm text-muted">{t("projectDetails.unassigned")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assigneeData.map(({ id, name }) => (
              <PersonChip key={id} name={name} />
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted">{t("projectDetails.description")}</p>
          <p className="text-sm leading-relaxed text-foreground">{project.description}</p>
        </div>
      )}

      {/* Cancel — low-prominence, always visible unless already cancelled */}
      {!isCancelled && (
        <div className="pt-2">
          <Button
            variant="light"
            color="danger"
            size="sm"
            fullWidth
            isDisabled={isTransitioning || isCancelling}
            onPress={() => setShowCancelConfirm(true)}
            className="text-muted hover:text-red-500"
          >
            {t("projectDetails.cancelJob")}
          </Button>
        </div>
      )}

      {/* Created — de-emphasised footnote */}
      <p className="text-center text-xs text-muted">{t("projectDetails.created")} {formatCreated(project.created_at, locale)}</p>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title={t("projectDetails.cancelJobTitle")}
        message={t("projectDetails.cancelJobMessage")}
        confirmLabel={t("projectDetails.cancelJobConfirm")}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
        isLoading={isCancelling}
      />
    </div>
  );
}
