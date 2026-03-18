"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { type ZonedDateTime } from "@internationalized/date";
import type { Project } from "@/lib/supabase";
import { createProject } from "@/lib/projects";
import { useOrg } from "@/context/OrgContext";

export interface PickedLocation {
  lng: number;
  lat: number;
}

interface NewProjectContextValue {
  isCreating: boolean;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  startTime: ZonedDateTime | null;
  setStartTime: (t: ZonedDateTime | null) => void;
  assignees: string[];
  setAssignees: (ids: string[]) => void;
  location: PickedLocation | null;
  setLocation: (loc: PickedLocation) => void;
  isSaving: boolean;
  saveError: string | null;
  startCreating: () => void;
  cancelCreating: () => void;
  /** Run the save and call onProjectSaved on success. */
  submitProject: () => Promise<void>;
  /** Register a callback that receives the saved project after a successful submit. */
  setOnProjectSaved: (cb: ((project: Project) => void) | null) => void;
}

const NewProjectContext = createContext<NewProjectContextValue>({
  isCreating: false,
  title: "",
  setTitle: () => {},
  description: "",
  setDescription: () => {},
  startTime: null,
  setStartTime: () => {},
  assignees: [],
  setAssignees: () => {},
  location: null,
  setLocation: () => {},
  isSaving: false,
  saveError: null,
  startCreating: () => {},
  cancelCreating: () => {},
  submitProject: async () => {},
  setOnProjectSaved: () => {},
});

export function NewProjectProvider({ children }: { children: ReactNode }) {
  const { activeOrg } = useOrg();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState<ZonedDateTime | null>(null);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onProjectSavedRef = useRef<((project: Project) => void) | null>(null);

  const setOnProjectSaved = useCallback((cb: ((project: Project) => void) | null) => {
    onProjectSavedRef.current = cb;
  }, []);

  const resetFormState = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartTime(null);
    setAssignees([]);
    setLocation(null);
    setSaveError(null);
    setIsSaving(false);
  }, []);

  const startCreating = useCallback(() => {
    setIsCreating(true);
    resetFormState();
  }, [resetFormState]);

  const cancelCreating = useCallback(() => {
    setIsCreating(false);
    resetFormState();
  }, [resetFormState]);

  const submitProject = useCallback(async () => {
    if (!location) return;
    setIsSaving(true);
    setSaveError(null);

    const { lng, lat } = location;
    const orgId = activeOrg?.organization_id ?? null;
    const startTimeToSave = startTime ? startTime.toDate().toISOString() : null;
    const descToSave = description.trim() || null;

    const { data: project, error } = await createProject(
      {
        title,
        description: descToSave,
        project_status: 0,
        start_time: startTimeToSave,
        location: `POINT(${lng} ${lat})`,
        organization_id: orgId,
      },
      assignees,
    );

    if (error) {
      console.error("Failed to save project:", error);
      setIsSaving(false);
      setSaveError(error);
      return;
    }

    setIsCreating(false);
    resetFormState();
    if (project) onProjectSavedRef.current?.(project);
  }, [location, activeOrg, startTime, title, description, assignees, resetFormState]);

  return (
    <NewProjectContext.Provider
      value={{
        isCreating,
        title,
        setTitle,
        description,
        setDescription,
        startTime,
        setStartTime,
        assignees,
        setAssignees,
        location,
        setLocation,
        isSaving,
        saveError,
        startCreating,
        cancelCreating,
        submitProject,
        setOnProjectSaved,
      }}
    >
      {children}
    </NewProjectContext.Provider>
  );
}

export function useNewProject() {
  return useContext(NewProjectContext);
}
