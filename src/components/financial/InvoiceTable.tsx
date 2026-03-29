"use client";

import { useState } from "react";
import React from "react";
import { useLocale } from "@/context/LocaleContext";
import type { Period } from "@/app/financial/page";

const LOCALE_CODE: Record<string, string> = { en: "en-GB", sv: "sv-SE" };

type AssigneeRow = { displayName: string; workedHours: number };
type InvoiceRow = {
  id: string;
  projectTitle: string;
  hours: number;
  pricePerHour: number;
  assignees: AssigneeRow[];
};

// Mock data — replace with real data fetching later
const MOCK_DATA: InvoiceRow[] = [
  {
    id: "1",
    projectTitle: "Renovation of City Hall",
    hours: 42,
    pricePerHour: 850,
    assignees: [
      { displayName: "Anna Larsson", workedHours: 18 },
      { displayName: "Erik Johansson", workedHours: 24 },
    ],
  },
  {
    id: "2",
    projectTitle: "Electrical Installation",
    hours: 16,
    pricePerHour: 950,
    assignees: [{ displayName: "Erik Johansson", workedHours: 16 }],
  },
  {
    id: "3",
    projectTitle: "Plumbing Service",
    hours: 8,
    pricePerHour: 750,
    assignees: [{ displayName: "Maria Svensson", workedHours: 8 }],
  },
];

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 text-muted transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function InvoiceTable({ period }: { period: Period }) {
  void period;
  const { t, locale } = useLocale();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const localeCode = LOCALE_CODE[locale] ?? "sv-SE";

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString(localeCode, {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    });

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-120 text-sm">
        <thead>
          <tr className="border-b border-border bg-muted-bg">
            <th className="w-10" />
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              {t("financial.project")}
            </th>
            <th className="px-4 py-3 text-right font-semibold text-foreground">
              {t("financial.hours")}
            </th>
            <th className="px-4 py-3 text-right font-semibold text-foreground">
              {t("financial.pricePerHour")}
            </th>
            <th className="px-4 py-3 text-right font-semibold text-foreground">
              {t("financial.sum")}
            </th>
          </tr>
        </thead>
        <tbody>
          {MOCK_DATA.map((row) => {
            const isExpanded = expandedRows.has(row.id);
            const sum = row.hours * row.pricePerHour;
            return (
              <React.Fragment key={row.id}>
                <tr
                  className={`cursor-pointer border-b border-border transition-colors hover:bg-muted-bg/50 ${isExpanded ? "bg-muted-bg/30" : ""}`}
                  onClick={() => toggleRow(row.id)}
                >
                  <td className="px-3 py-3 text-center">
                    <ChevronIcon expanded={isExpanded} />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.projectTitle}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {row.hours}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {formatCurrency(row.pricePerHour)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatCurrency(sum)}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-muted-bg/20">
                    <td colSpan={5} className="px-6 py-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              {t("financial.employee")}
                            </th>
                            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                              {t("financial.workedHours")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.assignees.map((a) => (
                            <tr
                              key={a.displayName}
                              className="border-b border-border/50 last:border-0"
                            >
                              <td className="py-2 text-foreground">
                                {a.displayName}
                              </td>
                              <td className="py-2 text-right text-foreground">
                                {a.workedHours}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
