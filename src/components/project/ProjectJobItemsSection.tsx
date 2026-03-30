"use client";

import { useEffect, useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@heroui/react";
import { getProjectItems, replaceProjectItems } from "@/lib/organizationItems";
import type { ProjectItemRow } from "@/lib/organizationItems";
import OrganizationItemsPicker from "@/components/project/OrganizationItemsPicker";

function ToolGlyph({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.502 4.502 0 0 1 6.318-4.318l3.282 3.282a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0l-3.282-3.282a4.5 4.5 0 0 1-.895-4.984 4.5 4.5 0 0 1 4.984-.895Z"
      />
    </svg>
  );
}

function MaterialGlyph({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

interface Props {
  projectId: string;
  organizationId: string;
  isAdmin: boolean;
  t: (key: string) => string;
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

export default function ProjectJobItemsSection({ projectId, organizationId, isAdmin, t }: Props) {
  const [rows, setRows] = useState<ProjectItemRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProjectItems(projectId).then(({ data }) => {
      if (cancelled) return;
      setRows(data ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const tools = (rows ?? []).filter((r) => r.organization_items?.kind === "tool");
  const materials = (rows ?? []).filter((r) => r.organization_items?.kind === "material");
  const hasAny = tools.length > 0 || materials.length > 0;

  const openEdit = () => {
    setDraftIds([...new Set((rows ?? []).map((r) => r.organization_item_id))]);
    setSaveError(null);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    setSaveError(null);
    const { error } = await replaceProjectItems(projectId, [...new Set(draftIds)]);
    setSaving(false);
    if (error) {
      setSaveError(error);
      return;
    }
    setEditOpen(false);
    getProjectItems(projectId).then(({ data }) => {
      setRows(data ?? []);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!hasAny && !isAdmin) {
    return null;
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.07] via-surface to-surface shadow-sm dark:from-emerald-500/10">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 [&_svg]:shrink-0">
                <ToolGlyph className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold leading-tight text-foreground">{t("organizationItems.bringToSiteTitle")}</h3>
                <p className="text-xs leading-snug text-muted break-words">{t("organizationItems.bringToSiteSubtitle")}</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="shrink-0 text-emerald-800 dark:text-emerald-200"
                aria-label={t("organizationItems.editJobItems")}
                onPress={openEdit}
              >
                <PencilIcon />
              </Button>
            )}
          </div>

          {!hasAny && isAdmin ? (
            <Button
              fullWidth
              variant="bordered"
              className="h-auto min-h-11 border-dashed border-emerald-500/40 px-4 py-3 text-emerald-900 dark:text-emerald-100"
              onPress={openEdit}
            >
              <span className="block w-full text-left text-sm font-semibold leading-snug whitespace-normal break-words">
                {t("organizationItems.adminEmptyHint")}
              </span>
            </Button>
          ) : (
            <div className="flex flex-col gap-4">
              {tools.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800/80 dark:text-emerald-200/90">
                    {t("organizationItems.tools")}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {tools.map((r) => (
                      <li
                        key={r.organization_item_id}
                        className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm font-medium text-foreground backdrop-blur-sm dark:bg-black/20"
                      >
                        <ToolGlyph className="h-4 w-4 shrink-0 text-primary dark:text-sky-300" />
                        <span className="min-w-0 break-words">{r.organization_items.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {materials.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-violet-800/80 dark:text-violet-200/90">
                    {t("organizationItems.materials")}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {materials.map((r) => (
                      <li
                        key={r.organization_item_id}
                        className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm font-medium text-foreground backdrop-blur-sm dark:bg-black/20"
                      >
                        <MaterialGlyph className="h-4 w-4 shrink-0 text-secondary dark:text-violet-300" />
                        <span className="min-w-0 break-words">{r.organization_items.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Modal isOpen={editOpen} onOpenChange={setEditOpen} size="lg" scrollBehavior="inside" placement="center" backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-border pb-4">
            <span>{t("organizationItems.editJobItemsTitle")}</span>
            <span className="text-xs font-normal text-muted">{t("organizationItems.editJobItemsSubtitle")}</span>
          </ModalHeader>
          <ModalBody className="py-4">
            <OrganizationItemsPicker
              organizationId={organizationId}
              value={draftIds}
              onChange={setDraftIds}
              t={t}
            />
            {saveError && <p className="text-sm text-danger">{saveError}</p>}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setEditOpen(false)} isDisabled={saving}>
              {t("projectDetails.cancelEdit")}
            </Button>
            <Button color="primary" isLoading={saving} onPress={() => void saveEdit()}>
              {t("projectDetails.save")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
