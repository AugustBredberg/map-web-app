"use client";

import { Button } from "@heroui/react";
import { STATUS_TRANSITIONS, STATUS_META, STATUS_SOLID_COLORS, type ProjectStatus } from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";
import ProjectStatusBadge from "@/components/project/ProjectStatusBadge";

interface Props {
  currentStatus: ProjectStatus;
  onTransition: (to: ProjectStatus) => void | Promise<void>;
  isLoading?: boolean;
}

function TransitionRow({
  toStatus,
  isPrimary,
  isLoading,
  onPress,
  actionLabel,
  targetLabel,
  statusDescription,
}: {
  toStatus: ProjectStatus;
  isPrimary: boolean;
  isLoading: boolean;
  onPress: () => void;
  actionLabel: string;
  targetLabel: string;
  statusDescription: string;
}) {
  const accent = STATUS_SOLID_COLORS[toStatus];
  const meta = STATUS_META[toStatus];

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border-2 text-left transition-transform active:scale-[0.99]",
        isPrimary ? "border-border bg-surface shadow-md" : "border-border/80 bg-surface/90",
      ].join(" ")}
    >
      <div className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: accent }} aria-hidden />
      <Button
        variant="light"
        className="h-auto min-h-0 w-full justify-start gap-0 rounded-2xl px-4 py-4 pl-5 text-left"
        isLoading={isLoading}
        onPress={onPress}
      >
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <span
              className={[
                "min-w-0 text-base font-bold leading-snug",
                isPrimary ? "text-foreground" : "text-foreground/90",
              ].join(" ")}
            >
              {actionLabel}
            </span>
            <span
              className={[
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                meta.bg,
                meta.iconColor,
                "border",
                meta.border,
              ].join(" ")}
            >
              {targetLabel}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted">{statusDescription}</p>
        </div>
      </Button>
    </div>
  );
}

export default function ProjectStatusTransitions({ currentStatus, onTransition, isLoading = false }: Props) {
  const { t } = useLocale();
  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">{t("statusTransitions.whereYouAre")}</p>
        <ProjectStatusBadge status={currentStatus} />
      </div>

      {transitions.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{t("statusTransitions.nextSteps")}</p>
          <p className="mb-3 text-sm text-muted">{t("statusTransitions.nextStepsHint")}</p>
          <div className="flex flex-col gap-3">
            {transitions
              .filter((tr) => tr.primary)
              .map((transition) => (
                <TransitionRow
                  key={transition.to}
                  toStatus={transition.to}
                  isPrimary
                  isLoading={!!isLoading}
                  onPress={() => onTransition(transition.to)}
                  actionLabel={t(`statusTransitions.${transition.labelKey}`)}
                  targetLabel={t(`statusLabels.${transition.to}`)}
                  statusDescription={t(`statusDescriptions.${transition.to}`)}
                />
              ))}
            {transitions
              .filter((tr) => !tr.primary)
              .map((transition) => (
                <TransitionRow
                  key={transition.to}
                  toStatus={transition.to}
                  isPrimary={false}
                  isLoading={!!isLoading}
                  onPress={() => onTransition(transition.to)}
                  actionLabel={t(`statusTransitions.${transition.labelKey}`)}
                  targetLabel={t(`statusLabels.${transition.to}`)}
                  statusDescription={t(`statusDescriptions.${transition.to}`)}
                />
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
