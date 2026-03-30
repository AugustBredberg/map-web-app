"use client";

import { useState, useCallback } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import type { Customer } from "@/lib/supabase";
import {
  updateCustomerContact,
  CUSTOMER_CONTACT_UPDATE_NO_MATCH,
} from "@/lib/customers";
import { useLocale } from "@/context/LocaleContext";

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

interface Props {
  customer: Customer;
  onUpdated: (next: Customer) => void;
}

export default function CustomerContactSection({ customer, onUpdated }: Props) {
  const { t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEdit = useCallback(() => {
    setPhone(customer.phone ?? "");
    setEmail(customer.email ?? "");
    setNotes(customer.notes ?? "");
    setSaveError(null);
    setIsEditing(true);
  }, [customer.phone, customer.email, customer.notes]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setSaveError(null);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    const { data, error } = await updateCustomerContact(customer.customer_id, {
      phone,
      email,
      notes,
    });
    setSaving(false);
    if (error || !data) {
      setSaveError(
        error === CUSTOMER_CONTACT_UPDATE_NO_MATCH
          ? t("customersPage.contactSaveNothingUpdated")
          : (error ?? t("customersPage.contactSaveError")),
      );
      return;
    }
    onUpdated(data);
    setIsEditing(false);
  }, [customer.customer_id, phone, email, notes, onUpdated, t]);

  const hasAnyDisplay =
    !!(customer.phone?.trim() || customer.email?.trim() || customer.notes?.trim());

  return (
    <section className="space-y-4" aria-labelledby="contact-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="contact-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t("customersPage.contactTitle")}
        </h3>
        {!isEditing && (
          <Button
            size="sm"
            variant="bordered"
            className="border-border bg-muted-bg/50"
            startContent={<PencilIcon className="h-3.5 w-3.5" />}
            onPress={startEdit}
          >
            {t("customersPage.editContact")}
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              label={t("customersPage.phone")}
              placeholder={t("createProjectWizard.customerPhonePlaceholder")}
              value={phone}
              onValueChange={setPhone}
              variant="bordered"
              type="tel"
              autoComplete="tel"
            />
            <Input
              label={t("customersPage.email")}
              placeholder={t("createProjectWizard.customerEmailPlaceholder")}
              value={email}
              onValueChange={setEmail}
              variant="bordered"
              type="email"
              autoComplete="email"
            />
            <Textarea
              label={t("customersPage.notes")}
              placeholder={t("createProjectWizard.customerNotesPlaceholder")}
              value={notes}
              onValueChange={setNotes}
              variant="bordered"
              minRows={3}
            />
            {saveError && (
              <p className="text-sm text-red-500 dark:text-red-400" role="alert">
                {saveError}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button color="primary" onPress={() => void save()} isDisabled={saving} isLoading={saving}>
                {t("customersPage.saveContact")}
              </Button>
              <Button variant="bordered" onPress={cancelEdit} isDisabled={saving}>
                {t("createProjectWizard.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid gap-3 text-sm">
            {customer.phone?.trim() ? (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 text-muted sm:w-28">{t("customersPage.phone")}</dt>
                <dd className="min-w-0 text-foreground">
                  <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                    {customer.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {customer.email?.trim() ? (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 text-muted sm:w-28">{t("customersPage.email")}</dt>
                <dd className="min-w-0 text-foreground">
                  <a
                    href={`mailto:${customer.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {customer.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {customer.notes?.trim() ? (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 text-muted sm:w-28">{t("customersPage.notes")}</dt>
                <dd className="min-w-0 whitespace-pre-wrap text-foreground">{customer.notes}</dd>
              </div>
            ) : null}
            {!hasAnyDisplay && (
              <p className="text-muted">{t("customersPage.noContactInfo")}</p>
            )}
          </dl>
        )}
      </div>
    </section>
  );
}
