"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@heroui/react";
import { useLocale } from "@/context/LocaleContext";
import { getTimeLogEntries, upsertTimeLogEntry, deleteTimeLogEntry } from "@/lib/timeLog";

interface Props {
  projectId: string;
  userId: string;
  /** Used to anchor the week picker and dim days before the job’s scheduled reference. */
  scheduleReferenceIso: string | null;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function ProjectAssigneeHoursLog({ projectId, userId, scheduleReferenceIso }: Props) {
  const { t, locale } = useLocale();
  const localeCode = locale === "sv" ? "sv-SE" : "en-GB";

  const [weekStart, setWeekStart] = useState<Date>(() =>
    getMonday(scheduleReferenceIso ? new Date(scheduleReferenceIso) : new Date()),
  );
  const [hours, setHours] = useState<Record<string, string>>({});
  const [savedHours, setSavedHours] = useState<Record<string, string>>({});
  const [entryIds, setEntryIds] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  const projectStart = scheduleReferenceIso ? new Date(scheduleReferenceIso) : null;
  if (projectStart) projectStart.setHours(0, 0, 0, 0);

  const weekNumber = getISOWeekNumber(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekEnd = addDays(weekStart, 6);
  const weekRangeLabel = (() => {
    const startDay = weekStart.toLocaleDateString(localeCode, { day: "numeric", month: "short" });
    const endDay = weekEnd.toLocaleDateString(localeCode, { day: "numeric", month: "short" });
    return `${startDay} – ${endDay}`;
  })();

  // Fetch entries from DB whenever the viewed week changes
  useEffect(() => {
    let cancelled = false;
    const dateFrom = toDateKey(weekStart);
    const dateTo = toDateKey(addDays(weekStart, 6));

    setIsLoading(true);
    setSaveError(null);
    getTimeLogEntries(projectId, userId, dateFrom, dateTo).then(({ data }) => {
      if (cancelled) return;
      setIsLoading(false);
      const newHours: Record<string, string> = {};
      const newIds: Record<string, string> = {};
      (data ?? []).forEach((entry) => {
        newHours[entry.date] = entry.hours > 0 ? String(entry.hours) : "";
        newIds[entry.date] = entry.id;
      });
      setHours(newHours);
      setSavedHours(newHours);
      setEntryIds(newIds);
    });
    return () => { cancelled = true; };
  }, [projectId, userId, weekStart]);

  const handlePrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7));
  }, []);

  const handleHoursChange = useCallback((key: string, value: string) => {
    setHours((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isDirty = days.some((day) => {
    const key = toDateKey(day);
    return (hours[key] ?? "") !== (savedHours[key] ?? "");
  });

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    const dirtyDays = days.filter((day) => {
      const key = toDateKey(day);
      return (hours[key] ?? "") !== (savedHours[key] ?? "");
    });

    try {
      await Promise.all(
        dirtyDays.map(async (day) => {
          const key = toDateKey(day);
          const val = hours[key] ?? "";
          const numVal = parseFloat(val);

          if (val !== "" && numVal > 0) {
            const { data, error } = await upsertTimeLogEntry(projectId, userId, key, numVal);
            if (error) throw new Error(error);
            if (data) setEntryIds((prev) => ({ ...prev, [key]: data.id }));
          } else {
            const existingId = entryIds[key];
            if (existingId) {
              const { error } = await deleteTimeLogEntry(existingId);
              if (error) throw new Error(error);
              setEntryIds((prev) => { const next = { ...prev }; delete next[key]; return next; });
            }
          }
        }),
      );

      setSavedHours((prev) => {
        const next = { ...prev };
        dirtyDays.forEach((day) => {
          const key = toDateKey(day);
          next[key] = hours[key] ?? "";
        });
        return next;
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("hoursLog.saveError"));
    } finally {
      setIsSaving(false);
    }
  }, [days, hours, savedHours, entryIds, projectId, userId, t]);

  return (
    <div className="rounded-xl border-border border-2 bg-surface px-4 py-3 flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {t("hoursLog.title")}
      </p>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevWeek}
          className="rounded-lg p-1.5 text-muted hover:bg-muted-bg hover:text-foreground transition-colors"
          aria-label={t("hoursLog.previousWeek")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-foreground">
            {t("hoursLog.weekLabel")} {weekNumber}
          </span>
          <span className="text-xs text-muted">{weekRangeLabel}</span>
        </div>

        <button
          onClick={handleNextWeek}
          className="rounded-lg p-1.5 text-muted hover:bg-muted-bg hover:text-foreground transition-colors"
          aria-label={t("hoursLog.nextWeek")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day squares */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const key = toDateKey(day);
          const dayLabel = day.toLocaleDateString(localeCode, { weekday: "short" });
          const isToday = key === todayKey;
          const isWeekend = i >= 5; // Sat = index 5, Sun = index 6
          const isBeforeStart = projectStart ? day < projectStart : false;
          const isDimmed = isWeekend || isBeforeStart;

          return (
            <div
              key={key}
              className={[
                "flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 transition-colors",
                isToday
                  ? "bg-primary/10 ring-2 ring-primary"
                  : isDimmed
                    ? "bg-muted-bg opacity-50"
                    : "bg-muted-bg",
              ].join(" ")}
            >
              <span className={[
                "text-xs font-medium capitalize",
                isToday ? "text-primary font-bold" : "text-muted",
              ].join(" ")}>
                {dayLabel}
              </span>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hours[key] ?? ""}
                onChange={(e) => handleHoursChange(key, e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-border bg-surface text-center text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          );
        })}
      </div>

      {saveError && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">{saveError}</p>
      )}

      {/* Save button */}
      <Button
        size="sm"
        color="primary"
        variant="flat"
        isDisabled={!isDirty || isSaving || isLoading}
        isLoading={isSaving}
        onPress={handleSave}
        fullWidth
      >
        {t("hoursLog.saveWeek")}
      </Button>
    </div>
  );
}
