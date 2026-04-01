"use client";

import { Button } from "@heroui/react";
import { STATUS_TRANSITIONS, STATUS_SOLID_COLORS, type ProjectStatus } from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";
import ProjectStatusBadge from "@/components/project/ProjectStatusBadge";

interface Props {
  currentStatus: ProjectStatus;
  onTransition: (to: ProjectStatus) => void | Promise<void>;
  isLoading?: boolean;
  /** When false, omits “Current status” / “What’s next” micro-labels (use when the page already has an `h2` above the card). */
  showSectionLabels?: boolean;
}

function TransitionRow({
  toStatus,
  isPrimary,
  isLoading,
  onPress,
  actionLabel,
}: {
  toStatus: ProjectStatus;
  isPrimary: boolean;
  isLoading: boolean;
  onPress: () => void;
  actionLabel: string;
}) {
  const accent = STATUS_SOLID_COLORS[toStatus];

  return (
    <div
      className={[
        "relative overflow-hidden rounded-lg border border-border bg-surface text-left shadow-sm",
        "transition-[box-shadow,transform,border-color] hover:shadow-md hover:border-primary/30",
        "active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:shadow-sm",
        isPrimary ? "" : "opacity-95",
      ].join(" ")}
    >
      <div className="absolute left-0 top-0 h-full w-[4px]" style={{ backgroundColor: accent }} aria-hidden />
      <Button
        variant="light"
        className="h-auto min-h-[52px] w-full cursor-pointer justify-start rounded-lg px-4 py-3 pl-[18px] text-left hover:bg-primary/5"
        isLoading={isLoading}
        onPress={onPress}
      >
        <div className="flex w-full min-w-0 flex-col gap-0.5 text-left">
          <span className="min-w-0 text-base font-semibold leading-snug text-foreground">{actionLabel}</span>
        </div>
      </Button>
    </div>
  );
}

export default function ProjectStatusTransitions({
  currentStatus,
  onTransition,
  isLoading = false,
  showSectionLabels = true,
}: Props) {
  const { t } = useLocale();
  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];
  const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {showSectionLabels ? <p className={labelClass}>{t("statusTransitions.whereYouAre")}</p> : null}
        <ProjectStatusBadge status={currentStatus} compact />
      </div>

      {transitions.length > 0 ? (
        <div className="flex flex-col gap-2">
          {showSectionLabels ? <p className={labelClass}>{t("statusTransitions.nextSteps")}</p> : null}
          <div className="flex flex-col gap-2">
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
                />
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
