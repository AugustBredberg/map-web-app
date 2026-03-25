"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import type { Project } from "@/lib/supabase";
import ProjectDetailsPanel from "@/components/project/ProjectDetailsPanel";
import { useDrawer } from "@/context/DrawerContext";
import { useLocale } from "@/context/LocaleContext";

interface Props {
  projects: Project[];
  onProjectUpdated: (updated: Project) => void;
  onProjectDeleted?: (projectId: string) => void;
}

export default function ProjectStackPanel({ projects, onProjectUpdated, onProjectDeleted }: Props) {
  const { t } = useLocale();
  const { updateTitle } = useDrawer();
  const [index, setIndex] = useState(0);
  const current = projects[index];

  // Keep the drawer title in sync with the current position
  useEffect(() => {
    updateTitle(`${t("projectDetails.title")} (${index + 1}/${projects.length})`);
  }, [index, projects.length, updateTitle, t]);

  return (
    <div className="flex flex-col">
      {/* Navigation bar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-1 border-b border-border shrink-0">
        <Button
          isIconOnly
          variant="flat"
          size="sm"
          isDisabled={index === 0}
          onPress={() => setIndex((i) => i - 1)}
          aria-label={t("projectStack.previous")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        <span className="text-sm text-muted font-medium tabular-nums">
          {index + 1} / {projects.length}
        </span>

        <Button
          isIconOnly
          variant="flat"
          size="sm"
          isDisabled={index === projects.length - 1}
          onPress={() => setIndex((i) => i + 1)}
          aria-label={t("projectStack.next")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Project details for the currently selected project */}
      {current && (
        <ProjectDetailsPanel
          project={current}
          onProjectUpdated={onProjectUpdated}
          onProjectDeleted={onProjectDeleted}
        />
      )}
    </div>
  );
}
