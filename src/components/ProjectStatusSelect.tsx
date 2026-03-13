"use client";

import { PROJECT_STATUSES, type ProjectStatus } from "@/context/NewProjectContext";
import ProjectStatusBadge from "@/components/ProjectStatusBadge";

interface Props {
  value: ProjectStatus;
  onChange: (s: ProjectStatus) => void;
  isDisabled?: boolean;
}

export default function ProjectStatusSelect({ value, onChange, isDisabled = false }: Props) {
  return (
    <div>
      <p className="mb-1.5 text-sm text-gray-600">Status</p>
      <div className="grid grid-cols-2 gap-2">
        {PROJECT_STATUSES.map((s, index) => {
          const isLastOdd =
            index === PROJECT_STATUSES.length - 1 && PROJECT_STATUSES.length % 2 !== 0;

          return (
            <ProjectStatusBadge
              key={s.value}
              status={s.value}
              isSelected={value === s.value}
              onClick={() => onChange(s.value)}
              isDisabled={isDisabled}
              className={isLastOdd ? "col-span-2" : ""}
            />
          );
        })}
      </div>
    </div>
  );
}

