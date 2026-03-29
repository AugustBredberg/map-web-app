"use client";

import { useState } from "react";
import React from "react";
import { useLocale } from "@/context/LocaleContext";
import type { Period } from "@/app/financial/page";

const LOCALE_CODE: Record<string, string> = { en: "en-GB", sv: "sv-SE" };

type ProjectWorkRow = { projectTitle: string; workedHours: number };
type PayrollRow = {
  id: string;
  employee: string;
  hours: number;
  salary: number;
  projects: ProjectWorkRow[];
};

// Mock data — replace with real data fetching later
const MOCK_DATA: PayrollRow[] = [
  {
    id: "1",
    employee: "Anna Larsson",
    hours: 85,
    salary: 42500,
    projects: [
      { projectTitle: "Renovation of City Hall", workedHours: 18 },
      { projectTitle: "Bridge Maintenance", workedHours: 67 },
    ],
  },
  {
    id: "2",
    employee: "Erik Johansson",
    hours: 62,
    salary: 31000,
    projects: [
      { projectTitle: "Renovation of City Hall", workedHours: 24 },
      { projectTitle: "Electrical Installation", workedHours: 16 },
      { projectTitle: "Road Repair", workedHours: 22 },
    ],
  },
  {
    id: "3",
    employee: "Maria Svensson",
    hours: 40,
    salary: 20000,
    projects: [
      { projectTitle: "Plumbing Service", workedHours: 8 },
      { projectTitle: "Window Replacement", workedHours: 32 },
    ],
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

export default function PayrollTable({ period }: { period: Period }) {
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
      <table className="w-full min-w-100 text-sm">
        <thead>
          <tr className="border-b border-border bg-muted-bg">
            <th className="w-10" />
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              {t("financial.employee")}
            </th>
            <th className="px-4 py-3 text-right font-semibold text-foreground">
              {t("financial.hours")}
            </th>
            <th className="px-4 py-3 text-right font-semibold text-foreground">
              {t("financial.salary")}
            </th>
          </tr>
        </thead>
        <tbody>
          {MOCK_DATA.map((row) => {
            const isExpanded = expandedRows.has(row.id);
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
                    {row.employee}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {row.hours}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatCurrency(row.salary)}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-muted-bg/20">
                    <td colSpan={4} className="px-6 py-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              {t("financial.project")}
                            </th>
                            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                              {t("financial.workedHours")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.projects.map((p) => (
                            <tr
                              key={p.projectTitle}
                              className="border-b border-border/50 last:border-0"
                            >
                              <td className="py-2 text-foreground">
                                {p.projectTitle}
                              </td>
                              <td className="py-2 text-right text-foreground">
                                {p.workedHours}
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
