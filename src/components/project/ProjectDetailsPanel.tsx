"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Input, Textarea, Select, SelectItem, Chip, DatePicker } from "@heroui/react";
import { CalendarDate, parseDate } from "@internationalized/date";
import PersonChip from "@/components/project/PersonChip";

import { getProjectAssignees, getOrgMembers, setProjectAssignees } from "@/lib/members";
import { updateProjectStatus, updateProject, deleteProject } from "@/lib/projects";
import ProjectAssigneeHoursLog from "@/components/project/ProjectAssigneeHoursLog";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useDrawer } from "@/context/DrawerContext";
import { hasMinRole } from "@/lib/supabase";
import ProjectStatusTransitions from "@/components/project/ProjectStatusTransitions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MapNavigateModal from "@/components/navigation/MapNavigateModal";
import ProjectHighlightedInstructions from "@/components/project/ProjectHighlightedInstructions";
import ProjectSiteAndContactCard from "@/components/project/ProjectSiteAndContactCard";
import ProjectCommentsSection from "@/components/project/ProjectCommentsSection";
import ProjectPhotosMockSection from "@/components/project/ProjectPhotosMockSection";
import { normalizeCustomerJoin } from "@/lib/projectDisplay";
import { parseProjectCoordinates } from "@/lib/navigationUrls";
import type { Project, OrganizationMember } from "@/lib/supabase";
import type { ProjectStatus } from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n";

interface Props {
  project: Project;
  onProjectUpdated?: (updated: Project) => void;
  onProjectDeleted?: (projectId: string) => void;
}

function formatDate(iso: string | null, locale: Locale) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale === "sv" ? "sv-SE" : "en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCreated(iso: string | null, locale: Locale) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale === "sv" ? "sv-SE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isoToCalendarDate(iso: string | null): CalendarDate | null {
  if (!iso) return null;
  try {
    return parseDate(iso.substring(0, 10));
  } catch {
    return null;
  }
}

function calendarDateToIso(date: CalendarDate, existingIso: string | null): string {
  const existing = existingIso ? new Date(existingIso) : null;
  const h = existing ? existing.getUTCHours() : 9;
  const m = existing ? existing.getUTCMinutes() : 0;
  return new Date(Date.UTC(date.year, date.month - 1, date.day, h, m)).toISOString();
}

type EditField = "title" | "startTime" | "assignees" | "description";

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

export default function ProjectDetailsPanel({ project, onProjectUpdated, onProjectDeleted }: Props) {
  const { t, locale } = useLocale();
  const { session, systemRole } = useAuth();
  const { activeRole, activeOrg } = useOrg();
  const { updateTitle } = useDrawer();
  const isAdmin = hasMinRole(activeRole, "admin");

  const [assigneeState, setAssigneeState] = useState<{
    projectId: string;
    data: { id: string; name: string }[];
  } | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ProjectStatus>((project.project_status ?? 0) as ProjectStatus);
  const [currentTitle, setCurrentTitle] = useState(project.title);
  const [currentStartTime, setCurrentStartTime] = useState<string | null>(project.start_time);
  const [currentDescription, setCurrentDescription] = useState<string | null>(project.description);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftStartTime, setDraftStartTime] = useState<CalendarDate | null>(null);
  const [draftAssignees, setDraftAssignees] = useState<string[]>([]);
  const [draftDescription, setDraftDescription] = useState("");
  const [members, setMembers] = useState<OrganizationMember[]>([]);

  useEffect(() => {
    setCurrentTitle(project.title);
    setCurrentStartTime(project.start_time);
    setCurrentDescription(project.description);
    setCurrentStatus((project.project_status ?? 0) as ProjectStatus);
    setEditingField(null);
    setSaveError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.project_id]);

  useEffect(() => {
    let cancelled = false;
    getProjectAssignees(project.project_id).then(({ data }) => {
      if (!cancelled) {
        setAssigneeState({ projectId: project.project_id, data: data ?? [] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [project.project_id]);

  useEffect(() => {
    if (!isAdmin || !activeOrg) return;
    getOrgMembers(activeOrg.organization_id).then(({ data }) => {
      if (data) setMembers(data);
    });
  }, [isAdmin, activeOrg]);

  const assigneesLoading = assigneeState?.projectId !== project.project_id;
  const assigneeData = assigneesLoading ? [] : (assigneeState?.data ?? []);

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
      setCurrentStatus(to);
      onProjectUpdated?.(data);
    },
    [project.project_id, onProjectUpdated, t],
  );

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

  const startEdit = useCallback(
    (field: EditField, currentAssigneeData: { id: string; name: string }[]) => {
      setSaveError(null);
      if (field === "title") setDraftTitle(currentTitle);
      if (field === "startTime") setDraftStartTime(isoToCalendarDate(currentStartTime));
      if (field === "assignees") setDraftAssignees(currentAssigneeData.map((a) => a.id));
      if (field === "description") setDraftDescription(currentDescription ?? "");
      setEditingField(field);
    },
    [currentTitle, currentStartTime, currentDescription],
  );

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setSaveError(null);
  }, []);

  const handleSaveTitle = useCallback(async () => {
    const trimmed = draftTitle.trim();
    if (!trimmed) return;
    setIsSaving(true);
    setSaveError(null);
    const { data, error } = await updateProject(project.project_id, { title: trimmed });
    setIsSaving(false);
    if (error || !data) {
      setSaveError(error ?? t("projectDetails.failedToSave"));
      return;
    }
    setCurrentTitle(data.title);
    updateTitle(data.title);
    onProjectUpdated?.(data);
    setEditingField(null);
  }, [draftTitle, project.project_id, updateTitle, onProjectUpdated, t]);

  const handleSaveStartTime = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    const newStartTime = draftStartTime ? calendarDateToIso(draftStartTime, currentStartTime) : null;
    const { data, error } = await updateProject(project.project_id, { start_time: newStartTime });
    setIsSaving(false);
    if (error || !data) {
      setSaveError(error ?? t("projectDetails.failedToSave"));
      return;
    }
    setCurrentStartTime(data.start_time);
    onProjectUpdated?.(data);
    setEditingField(null);
  }, [draftStartTime, currentStartTime, project.project_id, onProjectUpdated, t]);

  const handleSaveAssignees = useCallback(async () => {
    if (!activeOrg) return;
    setIsSaving(true);
    setSaveError(null);
    const { error } = await setProjectAssignees(project.project_id, activeOrg.organization_id, draftAssignees);
    setIsSaving(false);
    if (error) {
      setSaveError(error ?? t("projectDetails.failedToSave"));
      return;
    }
    const newAssigneeData = draftAssignees.map((id) => {
      const member = members.find((m) => m.user_id === id);
      return { id, name: member?.display_name ?? id };
    });
    setAssigneeState({ projectId: project.project_id, data: newAssigneeData });
    setEditingField(null);
  }, [draftAssignees, project.project_id, activeOrg, members, t]);

  const handleSaveDescription = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    const { data, error } = await updateProject(project.project_id, { description: draftDescription.trim() || null });
    setIsSaving(false);
    if (error || !data) {
      setSaveError(error ?? t("projectDetails.failedToSave"));
      return;
    }
    setCurrentDescription(data.description);
    onProjectUpdated?.(data);
    setEditingField(null);
  }, [draftDescription, project.project_id, onProjectUpdated, t]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const { error } = await deleteProject(project.project_id);
    setIsDeleting(false);
    if (error) {
      setDeleteError(error ?? t("projectDetails.failedToDeleteProject"));
      return;
    }
    setShowDeleteConfirm(false);
    onProjectDeleted?.(project.project_id);
  }, [project.project_id, onProjectDeleted, t]);

  const startDate = formatDate(currentStartTime, locale);
  const isCancelled = currentStatus === 6;
  const isAssignee = !!session && assigneeData.some((a) => a.id === session.user.id);
  const canEdit = isAdmin && editingField === null;
  const canDelete = (isAdmin || systemRole === "dev") && editingField === null;

  const customer = normalizeCustomerJoin(project);
  const loc = project.customer_location;
  const coordsParsed = parseProjectCoordinates(loc?.location?.coordinates ?? null);
  const addressText = loc?.address?.trim() ?? "";
  const canNavigate = Boolean(coordsParsed || addressText);
  const navigateLabel =
    addressText || (loc?.name ? `${loc.name}${addressText ? ` — ${addressText}` : ""}` : "") || customer?.name || currentTitle;

  const trimmedDescription = (currentDescription ?? "").trim();
  const hasInstructions = trimmedDescription.length > 0;

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      {/* Job title */}
      {editingField === "title" ? (
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            value={draftTitle}
            onValueChange={setDraftTitle}
            variant="bordered"
            isDisabled={isSaving}
            aria-label={t("projectDetails.titleAriaLabel")}
          />
          <div className="flex gap-2">
            <Button size="sm" color="primary" isLoading={isSaving} onPress={handleSaveTitle} isDisabled={!draftTitle.trim()}>
              {t("projectDetails.save")}
            </Button>
            <Button size="sm" variant="light" onPress={cancelEdit} isDisabled={isSaving}>
              {t("projectDetails.cancelEdit")}
            </Button>
          </div>
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold leading-snug text-foreground">{currentTitle}</h2>
          {canEdit && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="shrink-0 text-muted"
              onPress={() => startEdit("title", assigneeData)}
              aria-label={t("projectDetails.editTitle")}
            >
              <PencilIcon />
            </Button>
          )}
        </div>
      )}

      {/* Special instructions — first thing installers must see */}
      {editingField === "description" ? (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">{t("projectDetails.description")}</p>
          <Textarea
            value={draftDescription}
            onValueChange={setDraftDescription}
            variant="bordered"
            isDisabled={isSaving}
            autoFocus
            minRows={4}
            placeholder={t("createProject.descriptionPlaceholder")}
          />
          <div className="flex gap-2">
            <Button size="sm" color="primary" isLoading={isSaving} onPress={handleSaveDescription}>
              {t("projectDetails.save")}
            </Button>
            <Button size="sm" variant="light" onPress={cancelEdit} isDisabled={isSaving}>
              {t("projectDetails.cancelEdit")}
            </Button>
          </div>
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}
        </div>
      ) : hasInstructions ? (
        <ProjectHighlightedInstructions
          body={trimmedDescription}
          title={t("projectDetails.instructionsTitle")}
          subtitle={t("projectDetails.instructionsSubtitle")}
          headerRight={
            canEdit ? (
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                className="text-amber-900 dark:text-amber-100"
                onPress={() => startEdit("description", assigneeData)}
                aria-label={t("projectDetails.editDescription")}
              >
                <PencilIcon />
              </Button>
            ) : undefined
          }
        />
      ) : isAdmin ? (
        <Button
          fullWidth
          variant="bordered"
          className="h-auto min-h-12 !whitespace-normal border-dashed px-4 py-3 text-left font-semibold leading-snug break-words [align-items:stretch] [justify-content:center]"
          onPress={() => startEdit("description", assigneeData)}
        >
          {t("projectDetails.adminInstructionsHint")}
        </Button>
      ) : null}

      <ProjectSiteAndContactCard
        siteName={loc?.name ?? null}
        address={loc?.address ?? null}
        customer={customer}
        canNavigate={canNavigate}
        onNavigatePress={() => setMapModalOpen(true)}
      />

      <MapNavigateModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        destinationLabel={navigateLabel}
        lat={coordsParsed?.lat ?? null}
        lng={coordsParsed?.lng ?? null}
        addressFallback={addressText || null}
      />

      <section className="rounded-2xl border-2 border-border bg-surface p-4 shadow-sm">
        <ProjectStatusTransitions currentStatus={currentStatus} onTransition={handleTransition} isLoading={isTransitioning} />
        {transitionError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {transitionError}
          </p>
        )}
      </section>

      {/* Scheduled date */}
      <div className="rounded-2xl border-2 border-border bg-surface px-4 py-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{t("createProject.startTime")}</p>
        {editingField === "startTime" ? (
          <>
            <DatePicker
              aria-label={t("projectDetails.editStartTime")}
              variant="bordered"
              showMonthAndYearPickers
              granularity="day"
              value={draftStartTime}
              onChange={(value) => setDraftStartTime(value ? new CalendarDate(value.year, value.month, value.day) : null)}
              isDisabled={isSaving}
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" color="primary" isLoading={isSaving} onPress={handleSaveStartTime}>
                {t("projectDetails.save")}
              </Button>
              <Button size="sm" variant="light" onPress={cancelEdit} isDisabled={isSaving}>
                {t("projectDetails.cancelEdit")}
              </Button>
            </div>
            {saveError && <p className="mt-1 text-sm text-red-500">{saveError}</p>}
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {startDate ? (
                <span className="text-base font-semibold text-foreground">{startDate}</span>
              ) : (
                <span className="text-muted">{t("projectDetails.noStartTime")}</span>
              )}
            </div>
            {canEdit && (
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="shrink-0 text-muted"
                onPress={() => startEdit("startTime", assigneeData)}
                aria-label={t("projectDetails.editStartTime")}
              >
                <PencilIcon />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Assignees */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">{t("projectDetails.assignedTo")}</p>
          {canEdit && !assigneesLoading && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="text-muted"
              onPress={() => startEdit("assignees", assigneeData)}
              aria-label={t("projectDetails.editAssignees")}
            >
              <PencilIcon />
            </Button>
          )}
        </div>
        {assigneesLoading ? (
          <div className="flex flex-wrap gap-2 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-full bg-muted-bg" />
            ))}
          </div>
        ) : editingField === "assignees" ? (
          <div className="flex flex-col gap-2">
            <Select
              classNames={{ trigger: "min-h-10 py-2" }}
              isMultiline
              selectionMode="multiple"
              selectedKeys={new Set(draftAssignees)}
              onSelectionChange={(keys) => {
                if (typeof keys === "string") return;
                setDraftAssignees([...keys] as string[]);
              }}
              isDisabled={isSaving || members.length === 0}
              variant="bordered"
              placeholder={t("createProject.selectAssignees")}
              aria-label={t("projectDetails.editAssignees")}
              renderValue={(items) => (
                <div className="flex flex-wrap gap-1">
                  {items.map((item) => (
                    <Chip key={item.key} size="sm">
                      {item.textValue}
                    </Chip>
                  ))}
                </div>
              )}
            >
              {members.map((m) => (
                <SelectItem key={m.user_id} textValue={m.display_name ?? m.user_id}>
                  {m.display_name ?? m.user_id}
                </SelectItem>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button size="sm" color="primary" isLoading={isSaving} onPress={handleSaveAssignees}>
                {t("projectDetails.save")}
              </Button>
              <Button size="sm" variant="light" onPress={cancelEdit} isDisabled={isSaving}>
                {t("projectDetails.cancelEdit")}
              </Button>
            </div>
            {saveError && <p className="text-sm text-red-500">{saveError}</p>}
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

      <ProjectCommentsSection key={project.project_id} projectId={project.project_id} currentUserId={session?.user.id} />

      <ProjectPhotosMockSection />

      {assigneesLoading ? (
        <div className="rounded-2xl border-2 border-border bg-surface px-4 py-3 flex flex-col gap-3 animate-pulse">
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
        <ProjectAssigneeHoursLog projectId={project.project_id} userId={session.user.id} startTime={currentStartTime} />
      ) : null}

      {!isCancelled && isAdmin && (
        <div className="pt-1">
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

      {canDelete && (
        <div className={!isCancelled && isAdmin ? "" : "pt-1"}>
          <Button
            variant="light"
            color="danger"
            size="sm"
            fullWidth
            isDisabled={isTransitioning || isCancelling || isDeleting}
            onPress={() => setShowDeleteConfirm(true)}
            className="text-muted hover:text-red-500"
          >
            {t("projectDetails.deleteJob")}
          </Button>
          {deleteError && <p className="mt-1 text-center text-xs text-red-500">{deleteError}</p>}
        </div>
      )}

      <p className="text-center text-xs text-muted">
        {t("projectDetails.created")} {formatCreated(project.created_at, locale)}
      </p>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title={t("projectDetails.cancelJobTitle")}
        message={t("projectDetails.cancelJobMessage")}
        confirmLabel={t("projectDetails.cancelJobConfirm")}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
        isLoading={isCancelling}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t("projectDetails.deleteJobTitle")}
        message={t("projectDetails.deleteJobMessage")}
        confirmLabel={t("projectDetails.deleteJobConfirm")}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
