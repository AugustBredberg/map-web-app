"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
} from "@heroui/react";
import { listOrganizationItems, createOrganizationItem } from "@/lib/organizationItems";
import type { OrganizationItem, OrganizationItemKind } from "@/lib/supabase";

function ToolIcon({ className }: { className?: string }) {
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

interface Props {
  organizationId: string;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  t: (key: string) => string;
}

function MaterialIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

export default function OrganizationItemsPicker({ organizationId, value, onChange, disabled, t }: Props) {
  const [catalog, setCatalog] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | OrganizationItemKind>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createKind, setCreateKind] = useState<OrganizationItemKind>("tool");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listOrganizationItems(organizationId).then(({ data }) => {
      if (cancelled) return;
      const rows = data ?? [];
      setCatalog([...new Map(rows.map((r) => [r.organization_item_id, r])).values()]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  /** Stable unique ids (order preserved) — duplicate ids in `value` would duplicate chip keys. */
  const uniqueValue = useMemo(() => [...new Set(value)], [value]);

  const selectedSet = useMemo(() => new Set(uniqueValue), [uniqueValue]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((item) => {
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q);
    });
  }, [catalog, search, kindFilter]);

  const toggle = (id: string) => {
    if (disabled) return;
    if (selectedSet.has(id)) {
      onChange(uniqueValue.filter((x) => x !== id));
    } else {
      onChange([...uniqueValue, id]);
    }
  };

  const handleQuickCreate = async () => {
    const name = createName.trim();
    if (!name) return;
    setCreating(true);
    setCreateError(null);
    const { data, error } = await createOrganizationItem({
      organization_id: organizationId,
      kind: createKind,
      name,
    });
    setCreating(false);
    if (error || !data) {
      setCreateError(error ?? t("organizationItems.createFailed"));
      return;
    }
    setCatalog((prev) => [...prev, data].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)));
    onChange([...new Set([...uniqueValue, data.organization_item_id])]);
    setCreateName("");
    setCreateOpen(false);
  };

  const selectedItems = useMemo(
    () =>
      uniqueValue
        .map((id) => catalog.find((c) => c.organization_item_id === id))
        .filter(Boolean) as OrganizationItem[],
    [uniqueValue, catalog],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">{t("organizationItems.pickToolsMaterials")}</p>
        <Button
          size="sm"
          variant="flat"
          color="primary"
          className="shrink-0 font-semibold"
          isDisabled={disabled}
          onPress={() => {
            setCreateError(null);
            setCreateName("");
            setCreateKind("tool");
            setCreateOpen(true);
          }}
        >
          {t("organizationItems.quickCreate")}
        </Button>
      </div>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <span
              key={item.organization_item_id}
              className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                item.kind === "tool"
                  ? "border-primary/30 bg-primary/10 text-primary dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-100"
                  : "border-secondary/40 bg-secondary/10 text-secondary dark:border-violet-400/40 dark:bg-violet-500/15 dark:text-violet-100"
              }`}
            >
              {item.kind === "tool" ? (
                <ToolIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
              ) : (
                <MaterialIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
              )}
              <span className="max-w-[12rem] truncate">{item.name}</span>
              {!disabled && (
                <button
                  type="button"
                  className="ml-0.5 rounded-full p-0.5 opacity-70 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/15 dark:opacity-90"
                  aria-label={t("organizationItems.removeSelected")}
                  onClick={() => toggle(item.organization_item_id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <Input
        size="sm"
        variant="bordered"
        placeholder={t("organizationItems.searchPlaceholder")}
        value={search}
        onValueChange={setSearch}
        isDisabled={disabled}
        aria-label={t("organizationItems.searchPlaceholder")}
      />

      <div className="flex flex-wrap gap-2">
        {(["all", "tool", "material"] as const).map((k) => (
          <Button
            key={k}
            size="sm"
            variant={kindFilter === k ? "solid" : "flat"}
            color={kindFilter === k ? "default" : "default"}
            className={
              kindFilter === k
                ? "bg-foreground text-background"
                : "bg-muted-bg/60 text-foreground"
            }
            onPress={() => setKindFilter(k === "all" ? "all" : k)}
            isDisabled={disabled}
          >
            {k === "all" ? t("filters.all") : k === "tool" ? t("organizationItems.tools") : t("organizationItems.materials")}
          </Button>
        ))}
      </div>

      <ScrollShadow className="max-h-64 rounded-xl border border-border bg-muted-bg/30 p-2">
        {loading ? (
          <p className="px-2 py-6 text-center text-sm text-muted">{t("organizationItems.loadingCatalog")}</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted">{t("organizationItems.emptyCatalogHint")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((item) => {
              const on = selectedSet.has(item.organization_item_id);
              return (
                <li key={item.organization_item_id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(item.organization_item_id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      on
                        ? item.kind === "tool"
                          ? "bg-primary/15 text-foreground ring-1 ring-primary/30 dark:bg-sky-500/12 dark:text-slate-50 dark:ring-sky-400/35"
                          : "bg-secondary/15 text-foreground ring-1 ring-secondary/30 dark:bg-violet-500/12 dark:text-slate-50 dark:ring-violet-400/35"
                        : "hover:bg-muted-bg text-foreground"
                    } ${disabled ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        item.kind === "tool"
                          ? "bg-primary/10 text-primary dark:bg-sky-500/20 dark:text-sky-200"
                          : "bg-secondary/15 text-secondary dark:bg-violet-500/20 dark:text-violet-200"
                      }`}
                    >
                      {item.kind === "tool" ? (
                        <ToolIcon className="h-4 w-4" />
                      ) : (
                        <MaterialIcon className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 font-medium leading-snug">{item.name}</span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold leading-none ${
                        on
                          ? item.kind === "tool"
                            ? "border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-500"
                            : "border-violet-500 bg-violet-500 text-white dark:border-violet-400 dark:bg-violet-500"
                          : "border-muted text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollShadow>

      <Modal isOpen={createOpen} onOpenChange={setCreateOpen} placement="center" backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>{t("organizationItems.quickCreateTitle")}</span>
            <span className="text-xs font-normal text-muted">{t("organizationItems.quickCreateSubtitle")}</span>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
              autoFocus
              label={t("organizationItems.itemName")}
              variant="bordered"
              value={createName}
              onValueChange={setCreateName}
              placeholder={t("organizationItems.itemNamePlaceholder")}
            />
            <div className="flex gap-2">
              <Button
                fullWidth
                variant={createKind === "tool" ? "solid" : "bordered"}
                color="primary"
                onPress={() => setCreateKind("tool")}
              >
                {t("organizationItems.tools")}
              </Button>
              <Button
                fullWidth
                variant={createKind === "material" ? "solid" : "bordered"}
                color="secondary"
                onPress={() => setCreateKind("material")}
              >
                {t("organizationItems.materials")}
              </Button>
            </div>
            {createError && <p className="text-sm text-danger">{createError}</p>}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setCreateOpen(false)}>
              {t("projectDetails.cancelEdit")}
            </Button>
            <Button color="primary" isLoading={creating} isDisabled={!createName.trim()} onPress={() => void handleQuickCreate()}>
              {t("organizationItems.addAndSelect")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
