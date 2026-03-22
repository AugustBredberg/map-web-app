"use client";

import { useLocale } from "@/context/LocaleContext";
import type { Period } from "@/app/financial/page";

const LOCALE_CODE: Record<string, string> = { en: "en-GB", sv: "sv-SE" };

// Mock summary totals — replace with real data fetching later
const MOCK_SUMMARY = {
  amountToInvoice: 56900,
  payrollBasis: 93500,
  expenses: 10480,
  totalHours: 187,
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-2 ${accent}`}>{icon}</div>
        <span className="text-sm text-muted">{label}</span>
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
    </div>
  );
}

export default function SummaryCard(_: { period: Period }) {
  const { t, locale } = useLocale();
  const localeCode = LOCALE_CODE[locale] ?? "sv-SE";

  const formatCurrency = (amount: number) =>
    amount.toLocaleString(localeCode, {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    });

  const cards = [
    {
      label: t("financial.amountToInvoice"),
      value: formatCurrency(MOCK_SUMMARY.amountToInvoice),
      accent:
        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <InvoiceIcon />,
    },
    {
      label: t("financial.payrollBasis"),
      value: formatCurrency(MOCK_SUMMARY.payrollBasis),
      accent:
        "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
      icon: <PayrollIcon />,
    },
    {
      label: t("financial.expenses"),
      value: formatCurrency(MOCK_SUMMARY.expenses),
      accent:
        "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      icon: <ExpensesIcon />,
    },
    {
      label: t("financial.totalHours"),
      value: `${MOCK_SUMMARY.totalHours} h`,
      accent:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: <HoursIcon />,
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        {t("financial.summary")}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}

function InvoiceIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function PayrollIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function HoursIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
