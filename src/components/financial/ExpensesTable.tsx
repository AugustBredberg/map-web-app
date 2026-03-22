"use client";

import { useLocale } from "@/context/LocaleContext";
import type { Period } from "@/app/financial/page";

const LOCALE_CODE: Record<string, string> = { en: "en-GB", sv: "sv-SE" };

type ExpenseStatus = "approved" | "pending" | "rejected";

type ExpenseRow = {
  id: string;
  date: string;
  employee: string;
  projectTitle: string;
  amount: number;
  status: ExpenseStatus;
};

// Mock data — replace with real data fetching later
const MOCK_DATA: ExpenseRow[] = [
  {
    id: "1",
    date: "2026-03-05",
    employee: "Anna Larsson",
    projectTitle: "Renovation of City Hall",
    amount: 2450,
    status: "approved",
  },
  {
    id: "2",
    date: "2026-03-10",
    employee: "Erik Johansson",
    projectTitle: "Electrical Installation",
    amount: 890,
    status: "pending",
  },
  {
    id: "3",
    date: "2026-03-14",
    employee: "Maria Svensson",
    projectTitle: "Plumbing Service",
    amount: 340,
    status: "approved",
  },
  {
    id: "4",
    date: "2026-03-18",
    employee: "Erik Johansson",
    projectTitle: "Road Repair",
    amount: 1200,
    status: "pending",
  },
  {
    id: "5",
    date: "2026-03-22",
    employee: "Anna Larsson",
    projectTitle: "Bridge Maintenance",
    amount: 5600,
    status: "rejected",
  },
];

const STATUS_STYLES: Record<ExpenseStatus, string> = {
  approved:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_KEYS: Record<ExpenseStatus, string> = {
  approved: "financial.statusApproved",
  pending: "financial.statusPending",
  rejected: "financial.statusRejected",
};

export default function ExpensesTable(_: { period: Period }) {
  const { t, locale } = useLocale();
  const localeCode = LOCALE_CODE[locale] ?? "sv-SE";

  const formatCurrency = (amount: number) =>
    amount.toLocaleString(localeCode, {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(localeCode);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-155 text-sm">
        <thead>
          <tr className="border-b border-border bg-muted-bg">
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              {t("financial.date")}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              {t("financial.employee")}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              {t("financial.project")}
            </th>
            <th className="px-4 py-3 text-right font-semibold text-foreground">
              {t("financial.amount")}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              {t("financial.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {MOCK_DATA.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-muted-bg/50"
            >
              <td className="px-4 py-3 text-muted">{formatDate(row.date)}</td>
              <td className="px-4 py-3 font-medium text-foreground">
                {row.employee}
              </td>
              <td className="px-4 py-3 text-foreground">{row.projectTitle}</td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">
                {formatCurrency(row.amount)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                >
                  {t(STATUS_KEYS[row.status])}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
