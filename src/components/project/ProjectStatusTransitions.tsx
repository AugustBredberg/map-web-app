"use client";

import { Button } from "@heroui/react";
import {
  STATUS_TRANSITIONS,
  type ProjectStatus,
  type StatusTransition,
} from "@/lib/projectStatus";
import { useLocale } from "@/context/LocaleContext";

interface Props {
  currentStatus: ProjectStatus;
  onTransition: (to: ProjectStatus) => void | Promise<void>;
  isLoading?: boolean;
}

const COLOR_MAP: Record<StatusTransition["color"], "primary" | "success" | "warning" | "default"> = {
  primary: "primary",
  success: "success",
  warning: "warning",
  default: "default",
};

export default function ProjectStatusTransitions({ currentStatus, onTransition, isLoading = false }: Props) {
  const { t } = useLocale();
  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) return null;

  const primary = transitions.filter((transition) => transition.primary);
  const secondary = transitions.filter((transition) => !transition.primary);

  return (
    <div className="flex flex-col gap-2">
      {primary.map((transition) => (
        <Button
          key={transition.to}
          color={COLOR_MAP[transition.color]}
          size="lg"
          fullWidth
          isLoading={isLoading}
          onPress={() => onTransition(transition.to)}
          className="h-14 text-base font-semibold"
        >
          {t(`statusTransitions.${transition.labelKey}`)}
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-normal">
            {t(`statusLabels.${transition.to}`)}
          </span>
        </Button>
      ))}
      {secondary.map((transition) => (
        <Button
          key={transition.to}
          color={COLOR_MAP[transition.color]}
          variant="flat"
          size="md"
          fullWidth
          isLoading={isLoading}
          onPress={() => onTransition(transition.to)}
        >
          {t(`statusTransitions.${transition.labelKey}`)}
        </Button>
      ))}
    </div>
  );
}
