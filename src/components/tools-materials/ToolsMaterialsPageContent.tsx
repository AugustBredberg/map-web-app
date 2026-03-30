"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Input, Spinner } from "@heroui/react";
import {
  listOrganizationItems,
  createOrganizationItem,
  deleteOrganizationItem,
} from "@/lib/organizationItems";
import type { OrganizationItem, OrganizationItemKind } from "@/lib/supabase";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  organizationId: string;
  t: (key: string) => string;
}

export default function ToolsMaterialsPageContent({
  organizationId,
  t,
}: Props) {
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<OrganizationItemKind>("tool");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<"all" | OrganizationItemKind>("all");

  useEffect(() => {
    let cancelled = false;
    listOrganizationItems(organizationId).then(({ data }) => {
      if (cancelled) return;
      setItems(data ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const toolCount = useMemo(() => items.filter((i) => i.kind === "tool").length, [items]);
  const materialCount = useMemo(() => items.filter((i) => i.kind === "material").length, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (listFilter !== "all") list = list.filter((i) => i.kind === listFilter);
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q));
    return [...list].sort(
      (a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [items, search, listFilter]);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAdding(true);
    setAddError(null);
    const { data, error } = await createOrganizationItem({
      organization_id: organizationId,
      kind,
      name: trimmed,
    });
    setAdding(false);
    if (error || !data) {
      setAddError(error ?? t("organizationItems.createFailed"));
      return;
    }
    setName("");
    setItems((prev) => [...prev, data].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)));
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await deleteOrganizationItem(id);
    setDeletingId(null);
    setConfirmId(null);
    if (!error) {
      setItems((prev) => prev.filter((x) => x.organization_item_id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card shadow="sm" className="border border-border bg-surface/80">
          <CardBody className="flex flex-row items-center gap-4 px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("organizationItems.statToolsLabel")}</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{loading ? "—" : toolCount}</p>
            </div>
          </CardBody>
        </Card>
        <Card shadow="sm" className="border border-border bg-surface/80">
          <CardBody className="flex flex-row items-center gap-4 px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("organizationItems.statMaterialsLabel")}</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{loading ? "—" : materialCount}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Add */}
      <section aria-labelledby="add-heading">
        <h2 id="add-heading" className="sr-only">
          {t("organizationItems.addSectionTitle")}
        </h2>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <p className="mb-4 text-sm font-semibold text-foreground">{t("organizationItems.addSectionTitle")}</p>
          <div className="mb-4 inline-flex flex-wrap gap-2 rounded-2xl bg-muted-bg/50 p-1">
            <Button
              size="sm"
              radius="lg"
              variant={kind === "tool" ? "solid" : "flat"}
              color="primary"
              className="min-w-[8rem]"
              onPress={() => setKind("tool")}
            >
              {t("organizationItems.tools")}
            </Button>
            <Button
              size="sm"
              radius="lg"
              variant={kind === "material" ? "solid" : "flat"}
              color="secondary"
              className="min-w-[8rem]"
              onPress={() => setKind("material")}
            >
              {t("organizationItems.materials")}
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              className="flex-1"
              variant="bordered"
              label={t("organizationItems.itemName")}
              placeholder={t("organizationItems.itemNamePlaceholder")}
              value={name}
              onValueChange={setName}
              onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
            />
            <Button color="primary" size="lg" className="sm:shrink-0" isLoading={adding} isDisabled={!name.trim()} onPress={() => void handleAdd()}>
              {t("organizationItems.addToCatalog")}
            </Button>
          </div>
          {addError && <p className="mt-3 text-sm text-danger">{addError}</p>}
        </div>
      </section>

      {/* Browse */}
      <section aria-labelledby="catalog-heading">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="catalog-heading" className="text-lg font-semibold text-foreground">
              {t("organizationItems.catalogBrowseTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("organizationItems.catalogBrowseSubtitle")}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:max-w-md">
            <Input
              variant="bordered"
              size="sm"
              label={t("organizationItems.pageSearchLabel")}
              placeholder={t("organizationItems.pageSearchPlaceholder")}
              value={search}
              onValueChange={setSearch}
              startContent={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "tool", "material"] as const).map((key) => (
            <Button
              key={key}
              size="sm"
              radius="full"
              variant={listFilter === key ? "solid" : "flat"}
              color={listFilter === key ? "primary" : "default"}
              className={listFilter === key ? "" : "text-muted"}
              onPress={() => setListFilter(key === "all" ? "all" : key)}
            >
              {key === "all"
                ? t("organizationItems.filterAll")
                : key === "tool"
                  ? t("organizationItems.tools")
                  : t("organizationItems.materials")}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted-bg/20 px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">{items.length === 0 ? t("organizationItems.catalogEmpty") : t("organizationItems.noMatches")}</p>
            {items.length > 0 && search && (
              <Button size="sm" variant="light" className="mt-3" onPress={() => setSearch("")}>
                {t("organizationItems.clearSearch")}
              </Button>
            )}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filteredItems.map((item) => (
              <li
                key={item.organization_item_id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm transition-colors hover:bg-muted-bg/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    {item.kind === "tool" ? t("organizationItems.tools") : t("organizationItems.materials")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  isLoading={deletingId === item.organization_item_id}
                  onPress={() => setConfirmId(item.organization_item_id)}
                >
                  {t("organizationItems.deleteItem")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title={t("organizationItems.deleteItem")}
        message={t("organizationItems.deleteItemConfirm")}
        confirmLabel={t("settings.confirm")}
        cancelLabel={t("settings.cancel")}
        isLoading={deletingId !== null}
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && void handleDelete(confirmId)}
      />
    </div>
  );
}
