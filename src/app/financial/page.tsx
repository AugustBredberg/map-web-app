"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, Tab, Spinner } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { hasMinRole } from "@/lib/supabase";
import PeriodPicker from "@/components/financial/PeriodPicker";
import SummaryCard from "@/components/financial/SummaryCard";
import InvoiceTable from "@/components/financial/InvoiceTable";
import PayrollTable from "@/components/financial/PayrollTable";
import ExpensesTable from "@/components/financial/ExpensesTable";

export type Period = { year: number; month: number };

export default function FinancialPage() {
  const { activeOrg, activeRole, loading } = useOrg();
  const { systemRole } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const now = new Date();
  const [period, setPeriod] = useState<Period>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const canView = (!!activeOrg && hasMinRole(activeRole, "admin")) || systemRole === "dev";

  useEffect(() => {
    if (!loading && !canView) {
      router.replace("/projects");
    }
  }, [loading, canView, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canView) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-foreground">{t("financial.title")}</h1>

      <PeriodPicker value={period} onChange={setPeriod} />

      <SummaryCard period={period} />

      <Tabs
        variant="underlined"
        aria-label={t("financial.title")}
        classNames={{
          base: "w-full",
          tabList: "border-b border-border w-full overflow-x-auto",
          panel: "pt-4 px-0",
        }}
      >
        <Tab key="invoice" title={t("financial.tabInvoice")}>
          <InvoiceTable period={period} />
        </Tab>
        <Tab key="payroll" title={t("financial.tabPayroll")}>
          <PayrollTable period={period} />
        </Tab>
        <Tab key="expenses" title={t("financial.tabExpenses")}>
          <ExpensesTable period={period} />
        </Tab>
      </Tabs>
    </div>
  );
}
