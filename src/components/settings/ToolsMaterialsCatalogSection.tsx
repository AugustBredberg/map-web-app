"use client";

import { useEffect, useState } from "react";
import { Button, Input, Spinner } from "@heroui/react";
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

export default function ToolsMaterialsCatalogSection({ organizationId, t }: Props) {
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<OrganizationItemKind>("tool");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{t("organizationItems.settingsTitle")}</p>
      <p className="mb-4 text-sm text-muted">{t("organizationItems.settingsSubtitle")}</p>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={kind === "tool" ? "solid" : "flat"}
            color="primary"
            onPress={() => setKind("tool")}
          >
            {t("organizationItems.tools")}
          </Button>
          <Button
            size="sm"
            variant={kind === "material" ? "solid" : "flat"}
            color="secondary"
            onPress={() => setKind("material")}
          >
            {t("organizationItems.materials")}
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            className="flex-1"
            variant="bordered"
            label={t("organizationItems.itemName")}
            placeholder={t("organizationItems.itemNamePlaceholder")}
            value={name}
            onValueChange={setName}
            onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
          />
          <Button color="primary" isLoading={adding} isDisabled={!name.trim()} onPress={() => void handleAdd()}>
            {t("organizationItems.addToCatalog")}
          </Button>
        </div>
        {addError && <p className="text-xs text-danger">{addError}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">{t("organizationItems.catalogEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.organization_item_id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted">
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
    </section>
  );
}
