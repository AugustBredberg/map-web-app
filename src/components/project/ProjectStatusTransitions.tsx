"use client";

import { Button } from "@heroui/react";
import {
  STATUS_TRANSITIONS,
  STATUS_LABELS,
  type ProjectStatus,
  type StatusTransition,
} from "@/lib/projectStatus";

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
  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) return null;

  const primary = transitions.filter((t) => t.primary);
  const secondary = transitions.filter((t) => !t.primary);

  return (
    <div className="flex flex-col gap-2">
      {primary.map((t) => (
        <Button
          key={t.to}
          color={COLOR_MAP[t.color]}
          size="lg"
          fullWidth
          isLoading={isLoading}
          onPress={() => onTransition(t.to)}
          className="h-14 text-base font-semibold"
        >
          {t.label}
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-normal">
            {STATUS_LABELS[t.to]}
          </span>
        </Button>
      ))}
      {secondary.map((t) => (
        <Button
          key={t.to}
          color={COLOR_MAP[t.color]}
          variant="flat"
          size="md"
          fullWidth
          isLoading={isLoading}
          onPress={() => onTransition(t.to)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
