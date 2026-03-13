"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Project } from "@/lib/supabase";
import { createProject, updateProject, deleteProject as deleteProjectLib } from "@/lib/projects";
import { useOrg } from "@/context/OrgContext";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface PickedLocation {
  lng: number;
  lat: number;
}

export const PROJECT_STATUSES = [
  { value: 0, label: "Lead" },
  { value: 1, label: "Offered" },
  { value: 2, label: "Accepted" },
  { value: 3, label: "Ongoing" },
  { value: 4, label: "Done" },
  { value: 5, label: "Invoicing" },
  { value: 6, label: "Paid" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];

interface NewProjectContextValue {
  isCreating: boolean;
  isEditing: boolean;
  editingProjectId: string | null;
  title: string;
  setTitle: (t: string) => void;
  status: ProjectStatus;
  setStatus: (s: ProjectStatus) => void;
  startTime: string;
  setStartTime: (t: string) => void;
  assignees: string[];
  setAssignees: (ids: string[]) => void;
  location: PickedLocation | null;
  setLocation: (loc: PickedLocation) => void;
  isSaving: boolean;
  saveError: string | null;
  startCreating: () => void;
  cancelCreating: () => void;
  startEditing: (project: Project, initialAssignees: string[]) => void;
  cancelEditing: () => void;
  /** Run the save (create or update) and call onProjectSaved on success. */
  submitProject: () => Promise<void>;
  /** Register a callback that receives the saved project after a successful submit. */
  setOnProjectSaved: (cb: ((project: Project) => void) | null) => void;
  isDeleting: boolean;
  deleteError: string | null;
  /** Delete the currently-editing project. */
  deleteProject: () => Promise<void>;
  /** Register a callback that receives the deleted project id after a successful delete. */
  setOnProjectDeleted: (cb: ((projectId: string) => void) | null) => void;
}

const NewProjectContext = createContext<NewProjectContextValue>({
  isCreating: false,
  isEditing: false,
  editingProjectId: null,
  title: "",
  setTitle: () => {},
  status: 0,
  setStatus: () => {},
  startTime: "",
  setStartTime: () => {},
  assignees: [],
  setAssignees: () => {},
  location: null,
  setLocation: () => {},
  isSaving: false,
  saveError: null,
  startCreating: () => {},
  cancelCreating: () => {},
  startEditing: () => {},
  cancelEditing: () => {},
  submitProject: async () => {},
  setOnProjectSaved: () => {},
  isDeleting: false,
  deleteError: null,
  deleteProject: async () => {},
  setOnProjectDeleted: () => {},
});

export function NewProjectProvider({ children }: { children: ReactNode }) {
  const { activeOrg } = useOrg();

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(0);
  const [startTime, setStartTime] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onProjectSavedRef = useRef<((project: Project) => void) | null>(null);
  const onProjectDeletedRef = useRef<((projectId: string) => void) | null>(null);

  const setOnProjectSaved = useCallback((cb: ((project: Project) => void) | null) => {
    onProjectSavedRef.current = cb;
  }, []);

  const setOnProjectDeleted = useCallback((cb: ((projectId: string) => void) | null) => {
    onProjectDeletedRef.current = cb;
  }, []);

  const resetFormState = useCallback(() => {
    setTitle("");
    setStatus(0);
    setStartTime("");
    setAssignees([]);
    setLocation(null);
    setSaveError(null);
    setIsSaving(false);
  }, []);

  const deleteProject = useCallback(async () => {
    if (!editingProjectId) return;
    setIsDeleting(true);
    setDeleteError(null);

    const projectId = editingProjectId;
    const { error } = await deleteProjectLib(projectId);

    if (error) {
      setIsDeleting(false);
      setDeleteError(error);
      return;
    }

    setIsEditing(false);
    setEditingProjectId(null);
    resetFormState();
    setIsDeleting(false);
    onProjectDeletedRef.current?.(projectId);
  }, [editingProjectId, resetFormState]);

  const startCreating = useCallback(() => {
    setIsCreating(true);
    resetFormState();
  }, [resetFormState]);

  const cancelCreating = useCallback(() => {
    setIsCreating(false);
    resetFormState();
  }, [resetFormState]);

  const startEditing = useCallback((project: Project, initialAssignees: string[]) => {
    setIsEditing(true);
    setEditingProjectId(project.project_id);
    setTitle(project.title);
    setStatus((project.project_status ?? 0) as ProjectStatus);
    setStartTime(project.start_time ? toDatetimeLocal(project.start_time) : "");
    setAssignees(initialAssignees);
    if (project.location?.coordinates) {
      const [lng, lat] = project.location.coordinates;
      setLocation({ lng, lat });
    } else {
      setLocation(null);
    }
    setSaveError(null);
    setIsSaving(false);
  }, []);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditingProjectId(null);
    resetFormState();
  }, [resetFormState]);

  const submitProject = useCallback(async () => {
    if (!location) return;
    setIsSaving(true);
    setSaveError(null);

    const { lng, lat } = location;
    const orgId = activeOrg?.organization_id ?? null;
    const startTimeToSave = startTime || null;

    if (isEditing && editingProjectId) {
      const { data: project, error } = await updateProject(
        editingProjectId,
        {
          title,
          project_status: status,
          start_time: startTimeToSave,
          location: `POINT(${lng} ${lat})`,
        },
        assignees,
        orgId,
      );

      if (error) {
        console.error("Failed to update project:", error);
        setIsSaving(false);
        setSaveError(error);
        return;
      }

      setIsEditing(false);
      setEditingProjectId(null);
      resetFormState();
      if (project) onProjectSavedRef.current?.(project);
    } else {
      const { data: project, error } = await createProject(
        {
          title,
          project_status: status,
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
    }
  }, [location, activeOrg, startTime, isEditing, editingProjectId, title, status, assignees, resetFormState]);

  return (
    <NewProjectContext.Provider
      value={{
        isCreating,
        isEditing,
        editingProjectId,
        title,
        setTitle,
        status,
        setStatus,
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
        startEditing,
        cancelEditing,
        submitProject,
        setOnProjectSaved,
        isDeleting,
        deleteError,
        deleteProject,
        setOnProjectDeleted,
      }}
    >
      {children}
    </NewProjectContext.Provider>
  );
}

export function useNewProject() {
  return useContext(NewProjectContext);
}
