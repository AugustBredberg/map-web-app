"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Spinner, Chip } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { hasMinRole } from "@/lib/supabase";
import type { Customer } from "@/lib/supabase";
import type { Locale } from "@/lib/i18n";
import { STATUS_SOLID_COLORS } from "@/lib/projectStatus";
import {
  fetchCustomerOverviewData,
  type CustomerOverviewData,
  type CustomerOverviewRow,
} from "@/lib/customerOverview";
import CustomerContactSection from "@/components/customers/CustomerContactSection";

const LOCALE_CODE: Record<Locale, string> = { en: "en-GB", sv: "sv-SE" };

function formatListDate(iso: string | null, locale: Locale) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(LOCALE_CODE[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatHours(n: number, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_CODE[locale], {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(n);
}

function replaceCount(template: string, count: number) {
  return template.replace("{count}", String(count));
}

function matchesSearch(row: CustomerOverviewRow, q: string): boolean {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  const { customer, locations, projects } = row;
  const hay = [
    customer.name,
    customer.email,
    customer.phone,
    customer.notes,
    ...locations.flatMap((l) => [l.name, l.address]),
    ...projects.map((p) => p.title),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(n);
}

export default function CustomersOverviewPage() {
  const { activeOrg, activeRole, loading: orgLoading } = useOrg();
  const { systemRole } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();

  const [data, setData] = useState<CustomerOverviewData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canView =
    (!!activeOrg && hasMinRole(activeRole, "admin")) || systemRole === "dev";

  useEffect(() => {
    if (!orgLoading && !canView) {
      router.replace("/projects");
    }
  }, [orgLoading, canView, router]);

  useEffect(() => {
    if (!activeOrg || !canView) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      const { data: d, error } = await fetchCustomerOverviewData(activeOrg.organization_id);
      if (cancelled) return;
      if (error) {
        setLoadError(error);
        setData(null);
      } else {
        setData(d);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeOrg, canView]);

  const filteredRows = useMemo(() => {
    if (!data?.customers.length) return [];
    return data.customers.filter((row) => matchesSearch(row, search));
  }, [data, search]);

  const validSelectedId = useMemo(() => {
    if (!selectedId) return null;
    return filteredRows.some((r) => r.customer.customer_id === selectedId) ? selectedId : null;
  }, [filteredRows, selectedId]);

  const selectedRow = useMemo(
    () =>
      validSelectedId
        ? (filteredRows.find((r) => r.customer.customer_id === validSelectedId) ?? null)
        : null,
    [filteredRows, validSelectedId],
  );

  const siteCount = useMemo(() => {
    if (!data) return 0;
    return data.customers.reduce((acc, r) => acc + r.locations.length, 0);
  }, [data]);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const patchCustomer = useCallback((next: Customer) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customers: prev.customers.map((r) =>
          String(r.customer.customer_id) === String(next.customer_id) ? { ...r, customer: next } : r,
        ),
      };
    });
  }, []);

  if (orgLoading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canView) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <p className="text-sm text-red-500 dark:text-red-400">{t("customersPage.loadError")}</p>
      </div>
    );
  }

  if (!data?.customers.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-bold text-foreground">{t("customersPage.title")}</h1>
        <p className="text-sm text-muted">{t("customersPage.noCustomers")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-4 p-4 md:p-8">
      <header className="shrink-0 space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t("customersPage.title")}</h1>
        <p className="max-w-3xl text-sm text-muted">{t("customersPage.subtitle")}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Chip variant="flat" classNames={{ base: "bg-muted-bg border border-border" }}>
          <span className="text-muted">{t("customersPage.statCustomers")}:</span>{" "}
          <span className="font-semibold text-foreground">{data.orgTotals.customerCount}</span>
        </Chip>
        <Chip variant="flat" classNames={{ base: "bg-muted-bg border border-border" }}>
          <span className="text-muted">{t("customersPage.statSites")}:</span>{" "}
          <span className="font-semibold text-foreground">{siteCount}</span>
        </Chip>
        <Chip variant="flat" classNames={{ base: "bg-muted-bg border border-border" }}>
          <span className="text-muted">{t("customersPage.statJobs")}:</span>{" "}
          <span className="font-semibold text-foreground">{data.orgTotals.projectCount}</span>
        </Chip>
        <Chip variant="flat" classNames={{ base: "bg-muted-bg border border-border" }}>
          <span className="text-muted">{t("customersPage.statHours")}:</span>{" "}
          <span className="font-semibold text-foreground">
            {formatHours(data.orgTotals.loggedHoursTotal, locale)}
          </span>
        </Chip>
      </div>

      <Input
        variant="bordered"
        value={search}
        onValueChange={onSearchChange}
        placeholder={t("customersPage.searchPlaceholder")}
        aria-label={t("customersPage.searchPlaceholder")}
        classNames={{ inputWrapper: "bg-surface" }}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row md:gap-4">
        {/* Customer list */}
        <div
          className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface md:w-80 md:shrink-0 ${
            selectedRow ? "hidden md:flex" : "flex flex-1"
          }`}
        >
          <ul className="flex-1 space-y-1 overflow-y-auto p-2">
            {filteredRows.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-muted">{t("customersPage.noSearchResults")}</li>
            ) : (
              filteredRows.map((row) => {
                const id = row.customer.customer_id;
                const active = id === validSelectedId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className={`flex w-full cursor-pointer flex-col gap-1 rounded-lg px-3 py-3 text-left transition-colors ${
                        active ? "bg-selected" : "hover:bg-muted-bg"
                      }`}
                    >
                      <span className="truncate font-semibold text-foreground">{row.customer.name}</span>
                      <span className="text-xs text-muted">
                        {replaceCount(t("customersPage.jobsCount"), row.stats.projectCount)}
                        {" · "}
                        {replaceCount(t("customersPage.sitesCount"), row.locations.length)}
                        {row.stats.loggedHoursTotal > 0 && (
                          <>
                            {" · "}
                            {formatHours(row.stats.loggedHoursTotal, locale)} h
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Detail panel */}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface ${
            selectedRow ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedRow ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 md:hidden">
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onPress={() => setSelectedId(null)}
                  aria-label={t("customersPage.backToList")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <span className="truncate font-semibold text-foreground">{selectedRow.customer.name}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <CustomerDetailBody
                  row={selectedRow}
                  memberNames={data.memberNames}
                  onCustomerUpdated={patchCustomer}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted">
              {t("customersPage.selectCustomer")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerDetailBody({
  row,
  memberNames,
  onCustomerUpdated,
}: {
  row: CustomerOverviewRow;
  memberNames: Map<string, string>;
  onCustomerUpdated: (next: Customer) => void;
}) {
  const { t, locale } = useLocale();
  const c = row.customer;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="hidden md:block">
        <h2 className="text-xl font-bold text-foreground">{c.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {replaceCount(t("customersPage.jobsCount"), row.stats.projectCount)}
          {" · "}
          {replaceCount(t("customersPage.sitesCount"), row.locations.length)}
          {" · "}
          {t("customersPage.statHours")}: {formatHours(row.stats.loggedHoursTotal, locale)}
        </p>
      </div>

      <CustomerContactSection key={c.customer_id} customer={c} onUpdated={onCustomerUpdated} />

      <section className="space-y-3" aria-labelledby="sites-heading">
        <h3 id="sites-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t("customersPage.locationsTitle")}
        </h3>
        {row.locations.length === 0 ? (
          <p className="text-sm text-muted">{t("createProjectWizard.noLocations")}</p>
        ) : (
          <ul className="space-y-2">
            {row.locations.map((loc) => (
              <li
                key={loc.customer_location_id}
                className="rounded-lg border border-border bg-muted-bg/40 px-3 py-2 dark:bg-muted-bg/20"
              >
                <p className="font-medium text-foreground">{loc.name}</p>
                {loc.address && <p className="text-sm text-muted">{loc.address}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="jobs-heading">
        <h3 id="jobs-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t("customersPage.projectsTitle")}
        </h3>
        {row.projects.length === 0 ? (
          <p className="text-sm text-muted">{t("customersPage.noProjects")}</p>
        ) : (
          <ul className="space-y-3">
            {row.projects.map((job) => {
              const st = job.project_status ?? -1;
              const dot = STATUS_SOLID_COLORS[st] ?? "#94a3b8";
              const when = formatListDate(job.start_time, locale);
              const assigneeLabel =
                job.assigneeUserIds.length === 0
                  ? t("customersPage.unassigned")
                  : job.assigneeUserIds
                      .map((id) => memberNames.get(id) ?? id)
                      .join(", ");
              const hoursRows = [...job.hoursByUserId.entries()].filter(([, h]) => h > 0);
              const jobHoursTotal = [...job.hoursByUserId.values()].reduce((a, b) => a + b, 0);

              return (
                <li
                  key={job.project_id}
                  className="rounded-xl border border-border bg-background/80 p-4 dark:bg-background/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{job.title}</p>
                      {job.siteLabel && (
                        <p className="mt-0.5 text-xs text-muted">{job.siteLabel}</p>
                      )}
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        {when && <span>{when}</span>}
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
                          {t(`statusLabels.${st}`)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <p>{t("projectDetails.assignedTo")}</p>
                      <p className="mt-0.5 font-medium text-foreground">{assigneeLabel}</p>
                      {jobHoursTotal > 0 && (
                        <p className="mt-1 text-muted">
                          {t("financial.hours")}: {formatHours(jobHoursTotal, locale)} h
                        </p>
                      )}
                    </div>
                  </div>

                  {hoursRows.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                        {t("customersPage.perJob")}
                      </p>
                      <ul className="space-y-1.5">
                        {hoursRows.map(([uid, h]) => (
                          <li
                            key={uid}
                            className="flex justify-between gap-2 text-sm"
                          >
                            <span className="truncate text-foreground">
                              {memberNames.get(uid) ?? uid}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted">
                              {formatHours(h, locale)} h
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {row.projects.some((p) => [...p.hoursByUserId.values()].some((h) => h > 0)) && (
        <section className="space-y-3" aria-labelledby="hours-heading">
          <h3 id="hours-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t("customersPage.hoursByAssignee")}
          </h3>
          <CustomerHoursRollup projects={row.projects} memberNames={memberNames} />
        </section>
      )}
    </div>
  );
}

function CustomerHoursRollup({
  projects,
  memberNames,
}: {
  projects: CustomerOverviewRow["projects"];
  memberNames: Map<string, string>;
}) {
  const { t, locale } = useLocale();
  const byUser = new Map<string, number>();
  for (const p of projects) {
    for (const [uid, h] of p.hoursByUserId) {
      if (h <= 0) continue;
      byUser.set(uid, (byUser.get(uid) ?? 0) + h);
    }
  }
  const rows = [...byUser.entries()].sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{t("customersPage.noHours")}</p>;
  }
  return (
    <ul className="rounded-xl border border-border bg-muted-bg/30 dark:bg-muted-bg/15">
      {rows.map(([uid, h]) => (
        <li
          key={uid}
          className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
        >
          <span className="truncate font-medium text-foreground">{memberNames.get(uid) ?? uid}</span>
          <span className="shrink-0 tabular-nums text-sm text-muted">{formatHours(h, locale)} h</span>
        </li>
      ))}
    </ul>
  );
}
