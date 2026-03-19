"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Chip } from "@heroui/react";

import { getProjectAssignees } from "@/lib/members";
import { updateProjectStatus } from "@/lib/projects";
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
  const [assigneeData, setAssigneeData] = useState<{ id: string; name: string }[]>([]);
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
      if (!cancelled && data) setAssigneeData(data);
    });
    return () => { cancelled = true; };
  }, [project.project_id]);

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
    const { data, error } = await updateProjectStatus(project.project_id, 5);
    setIsCancelling(false);
    setShowCancelConfirm(false);
    if (error || !data) {
      setTransitionError(error ?? t("projectDetails.failedToCancelProject"));
      return;
    }
    setCurrentStatus(5);
    onProjectUpdated?.(data);
  }, [project.project_id, onProjectUpdated, t]);

  const startDate = formatDate(project.start_time, locale);
  const isCancelled = currentStatus === 5;

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

      {/* Assignees */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{t("projectDetails.assignedTo")}</p>
        {assigneeData.length === 0 ? (
          <p className="text-sm text-muted">{t("projectDetails.unassigned")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assigneeData.map(({ id, name }) => (
              <Chip key={id} size="md" color="primary" variant="faded">{name}</Chip>
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
