"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Project } from "@/lib/supabase";

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
  submitRequested: boolean;
  startCreating: () => void;
  cancelCreating: () => void;
  startEditing: (project: Project, initialAssignees: string[]) => void;
  cancelEditing: () => void;
  requestSubmit: () => void;
  /** Called by MapView after the save attempt completes. Pass an error message on failure. */
  onSubmitHandled: (error?: string) => void;
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
  submitRequested: false,
  startCreating: () => {},
  cancelCreating: () => {},
  startEditing: () => {},
  cancelEditing: () => {},
  requestSubmit: () => {},
  onSubmitHandled: () => {},
});

export function NewProjectProvider({ children }: { children: ReactNode }) {
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
  const [submitRequested, setSubmitRequested] = useState(false);

  const startCreating = useCallback(() => {
    setIsCreating(true);
    setTitle("");
    setStatus(0);
    setStartTime("");
    setAssignees([]);
    setLocation(null);
    setSaveError(null);
    setSubmitRequested(false);
    setIsSaving(false);
  }, []);

  const cancelCreating = useCallback(() => {
    setIsCreating(false);
    setTitle("");
    setStatus(0);
    setStartTime("");
    setAssignees([]);
    setLocation(null);
    setSaveError(null);
    setSubmitRequested(false);
    setIsSaving(false);
  }, []);

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
    setSubmitRequested(false);
    setIsSaving(false);
  }, []);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditingProjectId(null);
    setTitle("");
    setStatus(0);
    setStartTime("");
    setAssignees([]);
    setLocation(null);
    setSaveError(null);
    setSubmitRequested(false);
    setIsSaving(false);
  }, []);

  const requestSubmit = useCallback(() => {
    setSubmitRequested(true);
    setIsSaving(true);
    setSaveError(null);
  }, []);

  const onSubmitHandled = useCallback((error?: string) => {
    if (error) {
      setSubmitRequested(false);
      setIsSaving(false);
      setSaveError(error);
    } else {
      setIsCreating(false);
      setIsEditing(false);
      setEditingProjectId(null);
      setTitle("");
      setStatus(0);
      setStartTime("");
      setAssignees([]);
      setLocation(null);
      setIsSaving(false);
      setSaveError(null);
      setSubmitRequested(false);
    }
  }, []);

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
        submitRequested,
        startCreating,
        cancelCreating,
        startEditing,
        cancelEditing,
        requestSubmit,
        onSubmitHandled,
      }}
    >
      {children}
    </NewProjectContext.Provider>
  );
}

export function useNewProject() {
  return useContext(NewProjectContext);
}
