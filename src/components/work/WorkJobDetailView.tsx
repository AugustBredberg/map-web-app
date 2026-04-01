"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getProjectAssignees } from "@/lib/members";
import { updateProjectStatus } from "@/lib/projects";
import ProjectAssigneeHoursLog from "@/components/project/ProjectAssigneeHoursLog";
import ProjectCommentsSection from "@/components/project/ProjectCommentsSection";
import ProjectJobItemsSection from "@/components/project/ProjectJobItemsSection";
import ProjectPhotosMockSection from "@/components/project/ProjectPhotosMockSection";
import ProjectSiteAndContactCard from "@/components/project/ProjectSiteAndContactCard";
import ProjectStatusTransitions from "@/components/project/ProjectStatusTransitions";
import MapNavigateModal from "@/components/navigation/MapNavigateModal";
import ProjectHighlightedInstructions from "@/components/project/ProjectHighlightedInstructions";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { normalizeCustomerJoin } from "@/lib/projectDisplay";
import { parseProjectCoordinates } from "@/lib/navigationUrls";
import { formatScheduleShort, getScheduleBadge, getScheduleReferenceDate } from "@/lib/projectSchedule";
import type { Project } from "@/lib/supabase";
import type { ProjectStatus } from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";

function installerHintKey(status: number): string {
  const s = Math.min(6, Math.max(0, status));
  return `work.installerHint${s}`;
}

const INSTALLER_SECTION_HEADING_CLASS = "mb-2 text-sm font-semibold uppercase tracking-wide text-muted";

type Props = {
  project: Project;
  onProjectUpdated: (p: Project) => void;
};

export default function WorkJobDetailView({ project, onProjectUpdated }: Props) {
  const { t, locale } = useLocale();
  const { session } = useAuth();
  const { activeOrg } = useOrg();
  const localeCode = locale === "sv" ? "sv-SE" : "en-GB";

  const [assigneeState, setAssigneeState] = useState<{ projectId: string; data: { id: string; name: string }[] } | null>(
    null,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const currentStatus = (project.project_status ?? 0) as ProjectStatus;

  useEffect(() => {
    let cancelled = false;
    getProjectAssignees(project.project_id).then(({ data }) => {
      if (!cancelled) setAssigneeState({ projectId: project.project_id, data: data ?? [] });
    });
    return () => {
      cancelled = true;
    };
  }, [project.project_id]);

  const assigneesLoading = assigneeState?.projectId !== project.project_id;
  const assigneeData = assigneesLoading ? [] : (assigneeState?.data ?? []);
  const isAssignee = !!session && assigneeData.some((a) => a.id === session.user.id);

  const handleTransition = useCallback(
    async (to: ProjectStatus) => {
      setIsTransitioning(true);
      setTransitionError(null);
      const { data, error } = await updateProjectStatus(project.project_id, to);
      setIsTransitioning(false);
      if (error || !data) {
        setTransitionError(error ?? t("projectDetails.failedToUpdateStatus"));
        return;
      }
      onProjectUpdated(data);
    },
    [project.project_id, onProjectUpdated, t],
  );

  const customer = normalizeCustomerJoin(project);
  const loc = project.customer_location;
  const coordsParsed = parseProjectCoordinates(loc?.location?.coordinates ?? null);
  const addressText = loc?.address?.trim() ?? "";
  const canNavigate = Boolean(coordsParsed || addressText);
  const navigateLabel =
    addressText || (loc?.name ? `${loc.name}${addressText ? ` — ${addressText}` : ""}` : "") || customer?.name || project.title;

  const scheduleSummary = formatScheduleShort(project, localeCode, t("schedule.kind.asap"));
  const scheduleBadge = getScheduleBadge(project);
  const trimmedDescription = (project.description ?? "").trim();
  const hasInstructions = trimmedDescription.length > 0;

  const focusHint = useMemo(() => t(installerHintKey(project.project_status ?? 0)), [t, project.project_status]);

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Orientation — what matters first on site */}
      <section
        className="rounded-2xl border-2 border-primary/25 bg-primary/[0.06] px-4 py-4 dark:bg-primary/10"
        aria-labelledby="work-focus-heading"
      >
        <p id="work-focus-heading" className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t("work.installerFocusTitle")}
        </p>
        <p className="mt-2 text-base font-medium leading-snug text-foreground">{focusHint}</p>
      </section>

      {/* When & where */}
      <div>
        <h2 className={INSTALLER_SECTION_HEADING_CLASS}>{t("work.installerSectionSchedule")}</h2>
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-foreground">{scheduleSummary}</span>
            {scheduleBadge === "overdueWindow" && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/50 dark:text-red-200">
                {t("schedule.badge.overdueWindow")}
              </span>
            )}
            {scheduleBadge === "pastAppointment" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                {t("schedule.badge.pastAppointment")}
              </span>
            )}
          </div>
          <div className="mt-4">
            <ProjectSiteAndContactCard
              siteName={loc?.name ?? null}
              address={loc?.address ?? null}
              customer={customer}
              canNavigate={canNavigate}
              onNavigatePress={() => setMapModalOpen(true)}
            />
          </div>
        </section>
      </div>

      <MapNavigateModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        destinationLabel={navigateLabel}
        lat={coordsParsed?.lat ?? null}
        lng={coordsParsed?.lng ?? null}
        addressFallback={addressText || null}
      />

      {/* Instructions */}
      {hasInstructions && (
        <div>
          <h2 className={INSTALLER_SECTION_HEADING_CLASS}>{t("work.installerSectionInstructions")}</h2>
          <ProjectHighlightedInstructions
            body={trimmedDescription}
            title={t("projectDetails.instructionsTitle")}
            subtitle={t("projectDetails.instructionsSubtitle")}
            variant="field"
          />
        </div>
      )}

      {/* Tools & materials */}
      {activeOrg && (
        <div>
          <h2 className={INSTALLER_SECTION_HEADING_CLASS}>{t("work.installerSectionTools")}</h2>
          <ProjectJobItemsSection
            projectId={project.project_id}
            organizationId={activeOrg.organization_id}
            isAdmin={false}
            t={t}
            installerEmptyHintKey="work.installerToolsEmpty"
          />
        </div>
      )}

      {/* Status — primary workflow */}
      <div>
        <h2 className={INSTALLER_SECTION_HEADING_CLASS}>{t("work.installerSectionStatus")}</h2>
        <section className="rounded-xl border border-border bg-surface p-3">
          <ProjectStatusTransitions
            currentStatus={currentStatus}
            onTransition={handleTransition}
            isLoading={isTransitioning}
            showSectionLabels={false}
          />
          {transitionError && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
              {transitionError}
            </p>
          )}
        </section>
      </div>

      {/* Hours */}
      {isAssignee && session && (
        <div>
          <h2 className={INSTALLER_SECTION_HEADING_CLASS}>{t("work.installerSectionHours")}</h2>
          <ProjectAssigneeHoursLog
            projectId={project.project_id}
            userId={session.user.id}
            scheduleReferenceIso={getScheduleReferenceDate(project).toISOString()}
            density="installer"
          />
        </div>
      )}

      {/* Photos */}
      <div>
        <h2 className={INSTALLER_SECTION_HEADING_CLASS}>{t("work.installerSectionPhotos")}</h2>
        <ProjectPhotosMockSection variant="installer" />
      </div>

      {/* Messages */}
      <div>
        <h2 className={INSTALLER_SECTION_HEADING_CLASS}>{t("work.installerSectionMessages")}</h2>
        <ProjectCommentsSection projectId={project.project_id} currentUserId={session?.user.id} />
      </div>

      {!isAssignee && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {t("projectDetails.unassigned")}
        </p>
      )}
    </div>
  );
}
