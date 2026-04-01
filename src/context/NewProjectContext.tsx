"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { type ZonedDateTime, type CalendarDate } from "@internationalized/date";
import type { Project, Customer, CustomerLocation } from "@/lib/supabase";
import { createProject } from "@/lib/projects";
import { buildScheduleRow, type ScheduleKind } from "@/lib/projectSchedule";
import { createCustomer } from "@/lib/customers";
import { createCustomerLocation } from "@/lib/customerLocations";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import type { ProjectStatus } from "@/lib/projectStatus";

interface NewCustomerDraft {
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export type CreateStep =
  | "idle"
  | "pin"       // waiting for user to click map
  | "address"   // pin placed, geocoding + confirming address
  | "customer"  // address confirmed, selecting customer
  | "location"  // customer picked, selecting/creating location
  | "details"   // customer+location resolved, project details form
  | "saving";   // submitting to DB

export interface PinCoords {
  lng: number;
  lat: number;
}

interface NewProjectContextValue {
  step: CreateStep;
  pinCoords: PinCoords | null;
  detectedAddress: string | null;
  isGeocodingAddress: boolean;
  selectedCustomer: Customer | null;
  selectedLocation: CustomerLocation | null;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  projectStatus: ProjectStatus;
  setProjectStatus: (status: ProjectStatus) => void;
  scheduleKind: ScheduleKind;
  setScheduleKind: (k: ScheduleKind) => void;
  windowStart: CalendarDate | null;
  setWindowStart: (d: CalendarDate | null) => void;
  windowEnd: CalendarDate | null;
  setWindowEnd: (d: CalendarDate | null) => void;
  appointmentAt: ZonedDateTime | null;
  setAppointmentAt: (t: ZonedDateTime | null) => void;
  assignees: string[];
  setAssignees: (ids: string[]) => void;
  selectedOrganizationItemIds: string[];
  setSelectedOrganizationItemIds: (ids: string[]) => void;
  isWorking: boolean;
  saveError: string | null;
  // Step actions
  startCreating: () => void;
  cancelCreating: () => void;
  pinPlaced: (coords: PinCoords) => void;
  /** Map sets the orange pin + pans; context stores coords and address from the search hit. */
  pinPlacedFromSearch: (coords: PinCoords, placeName: string) => void;
  /** Registered by MapView so address search can sync the temp marker without a map click. */
  registerPlacePinOnMap: (fn: ((coords: PinCoords) => void) | null) => void;
  confirmAddress: () => void;
  goBackToPin: () => void;
  selectCustomer: (customer: Customer) => void;
  createAndSelectCustomer: (draft: NewCustomerDraft) => Promise<void>;
  selectLocation: (location: CustomerLocation) => void;
  createAndSelectLocation: (name: string, address: string | null) => Promise<void>;
  goBackToCustomer: () => void;
  submitProject: () => Promise<void>;
  /** Register a callback that receives the saved project after a successful submit. */
  setOnProjectSaved: (cb: ((project: Project) => void) | null) => void;
}

const NewProjectContext = createContext<NewProjectContextValue>({
  step: "idle",
  pinCoords: null,
  detectedAddress: null,
  isGeocodingAddress: false,
  selectedCustomer: null,
  selectedLocation: null,
  title: "",
  setTitle: () => {},
  description: "",
  setDescription: () => {},
  projectStatus: 0,
  setProjectStatus: () => {},
  scheduleKind: "asap",
  setScheduleKind: () => {},
  windowStart: null,
  setWindowStart: () => {},
  windowEnd: null,
  setWindowEnd: () => {},
  appointmentAt: null,
  setAppointmentAt: () => {},
  assignees: [],
  setAssignees: () => {},
  selectedOrganizationItemIds: [],
  setSelectedOrganizationItemIds: () => {},
  isWorking: false,
  saveError: null,
  startCreating: () => {},
  cancelCreating: () => {},
  pinPlaced: () => {},
  pinPlacedFromSearch: () => {},
  registerPlacePinOnMap: () => {},
  confirmAddress: () => {},
  goBackToPin: () => {},
  selectCustomer: () => {},
  createAndSelectCustomer: async () => {},
  selectLocation: () => {},
  createAndSelectLocation: async () => {},
  goBackToCustomer: () => {},
  submitProject: async () => {},
  setOnProjectSaved: () => {},
});

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

async function reverseGeocode(lng: number, lat: number): Promise<string | null> {
  if (!MAPTILER_KEY) return null;
  try {
    const res = await fetch(
      `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}`,
    );
    if (!res.ok) return null;
    const json = await res.json() as { features?: { place_name?: string }[] };
    return json?.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}

export function NewProjectProvider({ children }: { children: ReactNode }) {
  const { activeOrg } = useOrg();
  const { session } = useAuth();

  const [step, setStep] = useState<CreateStep>("idle");
  const [pinCoords, setPinCoords] = useState<PinCoords | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<CustomerLocation | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(0);
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>("asap");
  const [windowStart, setWindowStart] = useState<CalendarDate | null>(null);
  const [windowEnd, setWindowEnd] = useState<CalendarDate | null>(null);
  const [appointmentAt, setAppointmentAt] = useState<ZonedDateTime | null>(null);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [selectedOrganizationItemIds, setSelectedOrganizationItemIds] = useState<string[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onProjectSavedRef = useRef<((project: Project) => void) | null>(null);
  const placePinOnMapRef = useRef<((coords: PinCoords) => void) | null>(null);

  const setOnProjectSaved = useCallback((cb: ((project: Project) => void) | null) => {
    onProjectSavedRef.current = cb;
  }, []);

  const resetAll = useCallback(() => {
    setStep("idle");
    setPinCoords(null);
    setDetectedAddress(null);
    setIsGeocodingAddress(false);
    setSelectedCustomer(null);
    setSelectedLocation(null);
    setTitle("");
    setDescription("");
    setProjectStatus(0);
    setScheduleKind("asap");
    setWindowStart(null);
    setWindowEnd(null);
    setAppointmentAt(null);
    setAssignees([]);
    setSelectedOrganizationItemIds([]);
    setIsWorking(false);
    setSaveError(null);
  }, []);

  const startCreating = useCallback(() => {
    resetAll();
    setStep("pin");
  }, [resetAll]);

  const cancelCreating = useCallback(() => {
    resetAll();
  }, [resetAll]);

  const registerPlacePinOnMap = useCallback((fn: ((coords: PinCoords) => void) | null) => {
    placePinOnMapRef.current = fn;
  }, []);

  const pinPlaced = useCallback((coords: PinCoords) => {
    setPinCoords(coords);
    setStep("address");
    setDetectedAddress(null);
    setIsGeocodingAddress(true);

    void reverseGeocode(coords.lng, coords.lat).then((address) => {
      setDetectedAddress(address);
      setIsGeocodingAddress(false);
    });
  }, []);

  const pinPlacedFromSearch = useCallback((coords: PinCoords, placeName: string) => {
    placePinOnMapRef.current?.(coords);
    setPinCoords(coords);
    setStep("address");
    setDetectedAddress(placeName);
    setIsGeocodingAddress(false);
  }, []);

  const confirmAddress = useCallback(() => {
    setStep("customer");
  }, []);

  const goBackToPin = useCallback(() => {
    setDetectedAddress(null);
    setPinCoords(null);
    setStep("pin");
  }, []);

  const selectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedLocation(null);
    setStep("location");
  }, []);

  const createAndSelectCustomer = useCallback(async (draft: NewCustomerDraft) => {
    setIsWorking(true);
    const { data, error } = await createCustomer({
      name: draft.name.trim(),
      phone: draft.phone?.trim() || null,
      email: draft.email?.trim() || null,
      notes: draft.notes?.trim() || null,
      organization_id: activeOrg?.organization_id ?? null,
    });
    setIsWorking(false);
    if (error || !data) {
      setSaveError(error ?? "Failed to create customer");
      return;
    }
    setSelectedCustomer(data);
    setSelectedLocation(null);
    setStep("location");
  }, [activeOrg]);

  const selectLocation = useCallback((location: CustomerLocation) => {
    setSelectedLocation(location);
    const coords = location.location?.coordinates;
    if (coords) {
      const [lng, lat] = coords;
      const nextPin = { lng, lat };
      setPinCoords(nextPin);
      placePinOnMapRef.current?.(nextPin);
    }
    setStep("details");
  }, []);

  const createAndSelectLocation = useCallback(async (name: string, address: string | null) => {
    if (!pinCoords || !selectedCustomer) return;
    setIsWorking(true);
    const { data, error } = await createCustomerLocation({
      customer_id: selectedCustomer.customer_id,
      name,
      address,
      // Include SRID so inserts also work when DB enforces geometry(Point,4326).
      location: `SRID=4326;POINT(${pinCoords.lng} ${pinCoords.lat})`,
      created_by: session?.user.id ?? null,
    });
    setIsWorking(false);
    if (error || !data) {
      setSaveError(error ?? "Failed to create location");
      return;
    }
    setSelectedLocation(data);
    setStep("details");
  }, [pinCoords, selectedCustomer, session]);

  const goBackToCustomer = useCallback(() => {
    setSelectedLocation(null);
    setStep("customer");
  }, []);

  const submitProject = useCallback(async () => {
    if (!selectedCustomer || !selectedLocation) return;
    setStep("saving");
    setIsWorking(true);
    setSaveError(null);

    let scheduleRow;
    try {
      scheduleRow = buildScheduleRow(scheduleKind, windowStart, windowEnd, appointmentAt);
    } catch {
      setSaveError("Invalid schedule");
      setStep("details");
      setIsWorking(false);
      return;
    }

    const { data: project, error } = await createProject(
      {
        title,
        description: description.trim() || null,
        project_status: projectStatus,
        ...scheduleRow,
        customer_id: selectedCustomer.customer_id,
        customer_location_id: selectedLocation.customer_location_id,
        organization_id: activeOrg?.organization_id ?? null,
        organization_item_ids: [...new Set(selectedOrganizationItemIds)],
      },
      assignees,
    );

    if (error) {
      setSaveError(error);
      setStep("details");
      setIsWorking(false);
      return;
    }

    resetAll();
    if (project) onProjectSavedRef.current?.(project);
  }, [
    selectedCustomer,
    selectedLocation,
    title,
    description,
    projectStatus,
    scheduleKind,
    windowStart,
    windowEnd,
    appointmentAt,
    assignees,
    selectedOrganizationItemIds,
    activeOrg,
    resetAll,
  ]);

  return (
    <NewProjectContext.Provider
      value={{
        step,
        pinCoords,
        detectedAddress,
        isGeocodingAddress,
        selectedCustomer,
        selectedLocation,
        title,
        setTitle,
        description,
        setDescription,
        projectStatus,
        setProjectStatus,
        scheduleKind,
        setScheduleKind,
        windowStart,
        setWindowStart,
        windowEnd,
        setWindowEnd,
        appointmentAt,
        setAppointmentAt,
        assignees,
        setAssignees,
        selectedOrganizationItemIds,
        setSelectedOrganizationItemIds,
        isWorking,
        saveError,
        startCreating,
        cancelCreating,
        pinPlaced,
        pinPlacedFromSearch,
        registerPlacePinOnMap,
        confirmAddress,
        goBackToPin,
        selectCustomer,
        createAndSelectCustomer,
        selectLocation,
        createAndSelectLocation,
        goBackToCustomer,
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
