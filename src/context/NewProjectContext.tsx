"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface PickedLocation {
  lng: number;
  lat: number;
}

interface NewProjectContextValue {
  isCreating: boolean;
  title: string;
  setTitle: (t: string) => void;
  location: PickedLocation | null;
  setLocation: (loc: PickedLocation) => void;
  isSaving: boolean;
  saveError: string | null;
  submitRequested: boolean;
  startCreating: () => void;
  cancelCreating: () => void;
  requestSubmit: () => void;
  /** Called by MapView after the save attempt completes. Pass an error message on failure. */
  onSubmitHandled: (error?: string) => void;
}

const NewProjectContext = createContext<NewProjectContextValue>({
  isCreating: false,
  title: "",
  setTitle: () => {},
  location: null,
  setLocation: () => {},
  isSaving: false,
  saveError: null,
  submitRequested: false,
  startCreating: () => {},
  cancelCreating: () => {},
  requestSubmit: () => {},
  onSubmitHandled: () => {},
});

export function NewProjectProvider({ children }: { children: ReactNode }) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitRequested, setSubmitRequested] = useState(false);

  const startCreating = useCallback(() => {
    setIsCreating(true);
    setTitle("");
    setLocation(null);
    setSaveError(null);
    setSubmitRequested(false);
    setIsSaving(false);
  }, []);

  const cancelCreating = useCallback(() => {
    setIsCreating(false);
    setTitle("");
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
      setTitle("");
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
        title,
        setTitle,
        location,
        setLocation,
        isSaving,
        saveError,
        submitRequested,
        startCreating,
        cancelCreating,
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
