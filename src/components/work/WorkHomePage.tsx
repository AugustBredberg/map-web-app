"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { Spinner } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { fetchProjects } from "@/lib/projects";
import { partitionWorkProjects } from "@/lib/workOrder";
import type { Project } from "@/lib/supabase";
import { formatScheduleShort, getScheduleBadge } from "@/lib/projectSchedule";
import { STATUS_LABELS, STATUS_META, STATUS_SOLID_COLORS } from "@/lib/projectStatus";
import { normalizeCustomerJoin } from "@/lib/projectDisplay";

function WorkJobCard({ project, localeCode }: { project: Project; localeCode: string }) {
  const { t } = useLocale();
  const st = project.project_status ?? 0;
  const meta = STATUS_META[st] ?? STATUS_META[0];
  const accent = STATUS_SOLID_COLORS[st] ?? "#64748b";
  const schedule = formatScheduleShort(project, localeCode, t("schedule.kind.asap"));
  const badge = getScheduleBadge(project);
  const customer = normalizeCustomerJoin(project);
  const loc = project.customer_location;
  const line2 =
    loc?.address?.trim() ||
    loc?.name ||
    customer?.name ||
    null;

  return (
    <Link
      href={`/work/${project.project_id}`}
      className="group relative flex min-h-[4.5rem] gap-4 rounded-2xl border-2 border-border bg-surface p-4 shadow-sm transition-transform active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
      aria-label={`${t("work.openJob")}: ${project.title}`}
    >
      <span
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pl-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold leading-snug text-foreground group-hover:text-primary">{project.title}</h3>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.border} border`}
          >
            {STATUS_LABELS[st] ?? "—"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{schedule}</p>
        {line2 && (
          <p className="mt-0.5 truncate text-sm text-muted">{line2}</p>
        )}
        {badge === "overdueWindow" && (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{t("schedule.badge.overdueWindow")}</p>
        )}
        {badge === "pastAppointment" && (
          <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">{t("schedule.badge.pastAppointment")}</p>
        )}
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 shrink-0 self-center text-muted group-hover:text-foreground"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export default function WorkHomePage() {
  const { activeOrg } = useOrg();
  const { session } = useAuth();
  const { t, locale } = useLocale();
  const localeCode = locale === "sv" ? "sv-SE" : "en-GB";
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrg || !session?.user?.id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await fetchProjects(activeOrg.organization_id, {
        timeFilter: "all",
        statusFilters: [],
        assigneeUserIds: [session.user.id],
      });
      if (err) {
        setError(err);
        setProjects([]);
      } else {
        setProjects(data ?? []);
      }
      setLoading(false);
    };
    load();
  }, [activeOrg, session?.user?.id]);

  const { ongoing, upNext, blocked } = useMemo(
    () => partitionWorkProjects(projects),
    [projects],
  );

  const hasAny = ongoing.length > 0 || upNext.length > 0 || blocked.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">{t("work.pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{activeOrg?.name}</p>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 flex-col gap-8 px-4 py-6 pb-6">
        {loading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
            <Spinner color="primary" size="lg" />
          </div>
        )}

        {!loading && error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {t("work.loadError")}
          </p>
        )}

        {!loading && !error && !hasAny && (
          <p className="rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-10 text-center text-muted">{t("work.empty")}</p>
        )}

        {!loading && !error && hasAny && (
          <div className="flex flex-col gap-10">
            {ongoing.length > 0 && (
              <Section title={t("work.sectionOngoing")}>
                {ongoing.map((p) => (
                  <WorkJobCard key={p.project_id} project={p} localeCode={localeCode} />
                ))}
              </Section>
            )}
            {upNext.length > 0 && (
              <Section title={t("work.sectionUpNext")}>
                {upNext.map((p) => (
                  <WorkJobCard key={p.project_id} project={p} localeCode={localeCode} />
                ))}
              </Section>
            )}
            {blocked.length > 0 && (
              <Section title={t("work.sectionBlocked")}>
                {blocked.map((p) => (
                  <WorkJobCard key={p.project_id} project={p} localeCode={localeCode} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
