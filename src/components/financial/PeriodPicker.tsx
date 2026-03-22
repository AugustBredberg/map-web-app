"use client";

import { Select, SelectItem } from "@heroui/react";
import { useLocale } from "@/context/LocaleContext";
import type { Period } from "@/app/financial/page";

const LOCALE_CODE: Record<string, string> = { en: "en-GB", sv: "sv-SE" };

interface PeriodPickerProps {
  value: Period;
  onChange: (value: Period) => void;
}

export default function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const { t, locale } = useLocale();
  const localeCode = LOCALE_CODE[locale] ?? "sv-SE";

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];

  const months = Array.from({ length: 12 }, (_, i) => ({
    key: String(i + 1),
    label: new Intl.DateTimeFormat(localeCode, { month: "long" }).format(
      new Date(2000, i, 1)
    ),
  }));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted">{t("financial.period")}:</span>
      <div className="flex gap-2">
        <Select
          aria-label={t("financial.period")}
          variant="bordered"
          selectedKeys={new Set([String(value.month)])}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0];
            if (key) onChange({ ...value, month: Number(key) });
          }}
          className="w-40"
          size="sm"
        >
          {months.map((m) => (
            <SelectItem key={m.key}>{m.label}</SelectItem>
          ))}
        </Select>
        <Select
          aria-label="year"
          variant="bordered"
          selectedKeys={new Set([String(value.year)])}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0];
            if (key) onChange({ ...value, year: Number(key) });
          }}
          className="w-24"
          size="sm"
        >
          {years.map((y) => (
            <SelectItem key={String(y)}>{String(y)}</SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
