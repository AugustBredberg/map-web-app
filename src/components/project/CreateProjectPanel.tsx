"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Input,
  Textarea,
  Spinner,
  Select,
  SelectItem,
} from "@heroui/react";
import { CalendarDate, toZoned, getLocalTimeZone } from "@internationalized/date";
import { DatePicker } from "@heroui/react";
import { useNewProject } from "@/context/NewProjectContext";
import { useDrawer } from "@/context/DrawerContext";
import { useOrg } from "@/context/OrgContext";
import { fetchCustomers, fetchCustomersWithLocations } from "@/lib/customers";
import { fetchLocationsForCustomer } from "@/lib/customerLocations";
import type { Customer, CustomerLocation, OrganizationMember } from "@/lib/supabase";
import { getOrgMembers } from "@/lib/members";
import { useLocale } from "@/context/LocaleContext";
import {
  forwardGeocode,
  isMapTilerGeocodingAvailable,
  type ForwardGeocodeHit,
} from "@/lib/maptilerGeocoding";

// ---------------------------------------------------------------------------
// Distance helper
// ---------------------------------------------------------------------------

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number, t: (k: string) => string): string {
  if (meters < 1000) return `${Math.round(meters)}${t("createProjectWizard.meters")}`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// ---------------------------------------------------------------------------
// Completed step summary chips
// ---------------------------------------------------------------------------

function SummaryRow({
  label,
  value,
  onEdit,
  t,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted-bg px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="ml-2 shrink-0 text-xs text-primary hover:underline"
        >
          {t("createProjectWizard.change")}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Pin — search address or tap map
// ---------------------------------------------------------------------------

function StepPin() {
  const { pinPlacedFromSearch } = useNewProject();
  const { locale, t } = useLocale();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ForwardGeocodeHit[]>([]);
  const [open, setOpen] = useState(false);
  const requestIdRef = useRef(0);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const [menuLayout, setMenuLayout] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const searchEnabled = isMapTilerGeocodingAvailable();

  const repositionMenu = useCallback(() => {
    if (!open || suggestions.length === 0) {
      setMenuLayout(null);
      return;
    }
    const el = inputWrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuLayout({ top: r.bottom + 4, left: r.left, width: r.width });
  }, [open, suggestions.length]);

  const scheduleReposition = useCallback(() => {
    requestAnimationFrame(() => {
      repositionMenu();
    });
  }, [repositionMenu]);

  useLayoutEffect(() => {
    scheduleReposition();
  }, [scheduleReposition, suggestions, query]);

  useEffect(() => {
    if (!open || suggestions.length === 0) return;
    scheduleReposition();
    const el = inputWrapRef.current;
    const ro = el ? new ResizeObserver(() => scheduleReposition()) : null;
    if (el && ro) ro.observe(el);
    window.addEventListener("resize", scheduleReposition);
    window.addEventListener("scroll", scheduleReposition, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", scheduleReposition);
      window.removeEventListener("scroll", scheduleReposition, true);
    };
  }, [open, suggestions.length, scheduleReposition]);

  useEffect(() => {
    const myId = ++requestIdRef.current;
    const q = query.trim();
    if (!searchEnabled || q.length < 2) return;

    const timer = setTimeout(() => {
      void forwardGeocode(q, { language: locale, limit: 8 })
        .then((hits) => {
          if (myId !== requestIdRef.current) return;
          setSuggestions(hits);
          setOpen(hits.length > 0);
        })
        .catch(() => {
          if (myId !== requestIdRef.current) return;
          setSuggestions([]);
          setOpen(false);
        })
        .finally(() => {
          if (myId !== requestIdRef.current) return;
          setLoading(false);
        });
    }, 320);
    return () => clearTimeout(timer);
  }, [query, locale, searchEnabled]);

  const pickHit = useCallback(
    (hit: ForwardGeocodeHit) => {
      pinPlacedFromSearch({ lng: hit.lng, lat: hit.lat }, hit.placeName);
      setQuery(hit.placeName);
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
    },
    [pinPlacedFromSearch],
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("createProjectWizard.stepPinTitle")}
        </p>
        {searchEnabled ? (
          <div className="relative" ref={inputWrapRef}>
            <Input
              placeholder={t("createProjectWizard.searchAddressPlaceholder")}
              value={query}
              onValueChange={(v) => {
                setQuery(v);
                const t = v.trim();
                if (t.length < 2) {
                  setSuggestions([]);
                  setLoading(false);
                  setOpen(false);
                } else {
                  setLoading(true);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setOpen(true);
              }}
              variant="bordered"
              size="sm"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={open}
              endContent={loading ? <Spinner size="sm" /> : undefined}
              startContent={
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            {typeof document !== "undefined" &&
              open &&
              suggestions.length > 0 &&
              menuLayout &&
              createPortal(
                <ul
                  role="listbox"
                  style={{
                    position: "fixed",
                    top: menuLayout.top,
                    left: menuLayout.left,
                    width: menuLayout.width,
                    zIndex: 100,
                  }}
                  className="max-h-56 overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg"
                >
                  {suggestions.map((hit, i) => (
                    <li key={`${hit.lng},${hit.lat},${i}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="w-full px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-selected"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickHit(hit);
                        }}
                      >
                        {hit.placeName}
                      </button>
                    </li>
                  ))}
                </ul>,
                document.body,
              )}
          </div>
        ) : (
          <p className="text-sm text-muted">{t("createProjectWizard.searchAddressUnavailable")}</p>
        )}
        <p className="mt-2 text-xs text-muted">{t("createProjectWizard.stepPinHint")}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Address
// ---------------------------------------------------------------------------

function StepAddress() {
  const {
    detectedAddress,
    isGeocodingAddress,
    pinCoords,
    confirmAddress,
    goBackToPin,
    selectCustomer,
  } = useNewProject();
  const { activeOrg } = useOrg();
  const { t } = useLocale();

  type CustomerWithLocs = Customer & {
    customer_locations: {
      customer_location_id: string;
      name: string;
      address: string | null;
      location: { type: "Point"; coordinates: [number, number] } | null;
    }[];
  };
  const [nearbyCustomers, setNearbyCustomers] = useState<
    { customer: Customer; distance: number }[]
  >([]);

  useEffect(() => {
    if (!activeOrg || !pinCoords) return;
    let cancelled = false;
    fetchCustomersWithLocations(activeOrg.organization_id).then(({ data }) => {
      if (cancelled || !data) return;
      const results: { customer: Customer; distance: number }[] = [];
      for (const c of data as CustomerWithLocs[]) {
        let minDist = Infinity;
        for (const loc of c.customer_locations) {
          if (loc.location?.coordinates) {
            const [lng, lat] = loc.location.coordinates;
            const dist = haversineMeters(pinCoords.lat, pinCoords.lng, lat, lng);
            if (dist < minDist) minDist = dist;
          }
        }
        if (minDist < 500) {
          results.push({ customer: c, distance: minDist });
        }
      }
      results.sort((a, b) => a.distance - b.distance);
      setNearbyCustomers(results.slice(0, 3));
    });
    return () => { cancelled = true; };
  }, [activeOrg, pinCoords]);

  const displayAddress = isGeocodingAddress
    ? t("createProjectWizard.gettingAddress")
    : (detectedAddress ?? t("createProjectWizard.noAddressFound"));

  return (
    <div className="flex flex-col gap-4">
      {/* Detected address */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("createProjectWizard.stepAddress")}
        </p>
        <div className="flex items-start gap-2 rounded-xl border border-border bg-surface px-3 py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {isGeocodingAddress ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-muted">{displayAddress}</span>
            </div>
          ) : (
            <span className="text-sm text-foreground">{displayAddress}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          color="primary"
          size="sm"
          onPress={confirmAddress}
          isDisabled={isGeocodingAddress}
          className="flex-1"
        >
          {t("createProjectWizard.confirmAddress")}
        </Button>
        <Button variant="bordered" size="sm" onPress={goBackToPin} className="flex-1">
          {t("createProjectWizard.adjustOnMap")}
        </Button>
      </div>

      {/* Nearby customers */}
      {nearbyCustomers.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("createProjectWizard.nearbyCustomers")}
          </p>
          <div className="flex flex-col gap-1.5">
            {nearbyCustomers.map(({ customer, distance }) => (
              <button
                key={customer.customer_id}
                type="button"
                onClick={() => {
                  confirmAddress();
                  selectCustomer(customer);
                }}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-selected"
              >
                <span className="text-sm font-medium text-foreground">{customer.name}</span>
                <span className="text-xs text-muted">
                  {formatDistance(distance, t)} {t("createProjectWizard.away")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Customer
// ---------------------------------------------------------------------------

function StepCustomer() {
  const { selectCustomer, createAndSelectCustomer, detectedAddress, goBackToPin, isWorking } = useNewProject();
  const { activeOrg } = useOrg();
  const { t } = useLocale();

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (!activeOrg) return;
    let cancelled = false;
    fetchCustomers(activeOrg.organization_id, search).then(({ data }) => {
      if (!cancelled) setCustomers(data ?? []);
    });
    return () => { cancelled = true; };
  }, [activeOrg, search]);

  const isLoadingCustomers = customers === null;

  return (
    <div className="flex flex-col gap-4">
      {/* Completed: address */}
      <SummaryRow
        label={t("createProjectWizard.stepAddress")}
        value={detectedAddress ?? t("createProjectWizard.noAddressFound")}
        onEdit={goBackToPin}
        t={t}
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("createProjectWizard.stepCustomer")}
        </p>
        <Input
          placeholder={t("createProjectWizard.searchCustomers")}
          value={search}
          onValueChange={setSearch}
          variant="bordered"
          size="sm"
          startContent={
            <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        {isLoadingCustomers && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
        {!isLoadingCustomers &&
          customers.map((c) => (
            <button
              key={c.customer_id}
              type="button"
              onClick={() => selectCustomer(c)}
              className="flex items-center rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-selected"
            >
              <span className="text-sm font-medium text-foreground">{c.name}</span>
            </button>
          ))}

        {/* Create new customer */}
        {!showNewForm ? (
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-left transition-colors hover:bg-selected"
          >
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-primary">{t("createProjectWizard.createNewCustomer")}</span>
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3">
            <Input
              autoFocus
              label={t("createProjectWizard.stepCustomer")}
              placeholder={t("createProjectWizard.customerNamePlaceholder")}
              value={newName}
              onValueChange={setNewName}
              variant="bordered"
              size="sm"
              classNames={{ inputWrapper: "bg-background" }}
            />
            <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted-bg/30 p-3 dark:bg-muted-bg/15">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("createProjectWizard.newCustomerContactHint")}
              </p>
              <Input
                placeholder={t("createProjectWizard.customerPhonePlaceholder")}
                value={newPhone}
                onValueChange={setNewPhone}
                variant="bordered"
                size="sm"
                type="tel"
                autoComplete="tel"
                classNames={{ inputWrapper: "bg-background" }}
              />
              <Input
                placeholder={t("createProjectWizard.customerEmailPlaceholder")}
                value={newEmail}
                onValueChange={setNewEmail}
                variant="bordered"
                size="sm"
                type="email"
                autoComplete="email"
                classNames={{ inputWrapper: "bg-background" }}
              />
              <Textarea
                placeholder={t("createProjectWizard.customerNotesPlaceholder")}
                value={newNotes}
                onValueChange={setNewNotes}
                variant="bordered"
                minRows={2}
                size="sm"
                classNames={{ inputWrapper: "bg-background" }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                color="primary"
                size="sm"
                className="flex-1"
                isDisabled={!newName.trim() || isWorking}
                isLoading={isWorking}
                onPress={() =>
                  void createAndSelectCustomer({
                    name: newName.trim(),
                    phone: newPhone.trim() || null,
                    email: newEmail.trim() || null,
                    notes: newNotes.trim() || null,
                  })
                }
              >
                {t("createProjectWizard.createNewCustomer")}
              </Button>
              <Button
                variant="bordered"
                size="sm"
                onPress={() => {
                  setShowNewForm(false);
                  setNewName("");
                  setNewPhone("");
                  setNewEmail("");
                  setNewNotes("");
                }}
              >
                {t("createProjectWizard.cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Location
// ---------------------------------------------------------------------------

function StepLocation() {
  const {
    selectedCustomer,
    pinCoords,
    detectedAddress,
    goBackToPin,
    goBackToCustomer,
    selectLocation,
    createAndSelectLocation,
    isWorking,
  } = useNewProject();
  const { t } = useLocale();

  const [locations, setLocations] = useState<CustomerLocation[] | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState(detectedAddress ?? "");

  useEffect(() => {
    if (!selectedCustomer) return;
    let cancelled = false;
    fetchLocationsForCustomer(selectedCustomer.customer_id).then(({ data }) => {
      if (!cancelled) setLocations(data ?? []);
    });
    return () => { cancelled = true; };
  }, [selectedCustomer]);

  const isLoadingLocs = locations === null;

  const getDistanceLabel = (loc: CustomerLocation) => {
    if (!pinCoords || !loc.location?.coordinates) return null;
    const [lng, lat] = loc.location.coordinates;
    const dist = haversineMeters(pinCoords.lat, pinCoords.lng, lat, lng);
    return formatDistance(dist, t);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Completed: address */}
      <SummaryRow
        label={t("createProjectWizard.stepAddress")}
        value={detectedAddress ?? t("createProjectWizard.noAddressFound")}
        onEdit={goBackToPin}
        t={t}
      />
      {/* Completed: customer */}
      <SummaryRow
        label={t("createProjectWizard.stepCustomer")}
        value={selectedCustomer?.name ?? ""}
        onEdit={goBackToCustomer}
        t={t}
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("createProjectWizard.stepLocation")}
        </p>

        {isLoadingLocs && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}

        {!isLoadingLocs && (locations ?? []).length > 0 && (
          <div className="mb-2 flex flex-col gap-1">
            <p className="mb-1 text-xs text-muted">{t("createProjectWizard.existingLocations")}</p>
            {(locations ?? []).map((loc) => {
              const distLabel = getDistanceLabel(loc);
              return (
                <button
                  key={loc.customer_location_id}
                  type="button"
                  onClick={() => selectLocation(loc)}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-selected"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{loc.name}</p>
                    {loc.address && (
                      <p className="truncate text-xs text-muted">{loc.address}</p>
                    )}
                  </div>
                  {distLabel && (
                    <span className="ml-2 shrink-0 text-xs text-muted">{distLabel} {t("createProjectWizard.away")}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Create new location */}
        {!showNewForm ? (
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-left transition-colors hover:bg-selected"
          >
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-primary">{t("createProjectWizard.createNewLocation")}</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
            <Input
              autoFocus
              label={t("createProjectWizard.locationNameLabel")}
              placeholder={t("createProjectWizard.locationNamePlaceholder")}
              value={newLocName}
              onValueChange={setNewLocName}
              variant="bordered"
              size="sm"
            />
            <Input
              label={t("createProjectWizard.addressLabel")}
              value={newLocAddress}
              onValueChange={setNewLocAddress}
              variant="bordered"
              size="sm"
            />
            <div className="flex gap-2">
              <Button
                color="primary"
                size="sm"
                className="flex-1"
                isDisabled={!newLocName.trim() || isWorking}
                isLoading={isWorking}
                onPress={() => createAndSelectLocation(newLocName.trim(), newLocAddress.trim() || null)}
              >
                {t("createProjectWizard.createNewLocation")}
              </Button>
              <Button
                variant="bordered"
                size="sm"
                onPress={() => { setShowNewForm(false); setNewLocName(""); }}
              >
                {t("createProjectWizard.cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Project Details
// ---------------------------------------------------------------------------

function StepDetails() {
  const {
    selectedCustomer,
    selectedLocation,
    detectedAddress,
    goBackToPin,
    goBackToCustomer,
    title,
    setTitle,
    description,
    setDescription,
    startTime,
    setStartTime,
    assignees,
    setAssignees,
    isWorking,
    saveError,
    submitProject,
  } = useNewProject();
  // closeDrawer is not needed here — submitProject resets step which triggers MapView cleanup
  const { activeOrg } = useOrg();
  const { t } = useLocale();

  const [members, setMembers] = useState<OrganizationMember[]>([]);

  useEffect(() => {
    if (!activeOrg) return;
    let cancelled = false;
    getOrgMembers(activeOrg.organization_id).then(({ data }) => {
      if (!cancelled && data) setMembers(data);
    });
    return () => { cancelled = true; };
  }, [activeOrg]);

  const dateValue = startTime
    ? new CalendarDate(startTime.year, startTime.month, startTime.day)
    : null;

  const handleDateChange = (date: CalendarDate | null) => {
    if (!date) { setStartTime(null); return; }
    const h = startTime?.hour ?? 9;
    const m = startTime?.minute ?? 0;
    setStartTime(toZoned(date, getLocalTimeZone()).set({ hour: h, minute: m }));
  };

  const canSubmit = title.trim().length > 0 && !isWorking;

  return (
    <div className="flex flex-col gap-4">
      {/* Completed summaries */}
      <SummaryRow
        label={t("createProjectWizard.stepAddress")}
        value={detectedAddress ?? t("createProjectWizard.noAddressFound")}
        onEdit={goBackToPin}
        t={t}
      />
      <SummaryRow
        label={t("createProjectWizard.stepCustomer")}
        value={selectedCustomer?.name ?? ""}
        onEdit={goBackToCustomer}
        t={t}
      />
      <SummaryRow
        label={t("createProjectWizard.stepLocation")}
        value={[selectedLocation?.name, selectedLocation?.address].filter(Boolean).join(" — ")}
        t={t}
      />

      {/* Project details form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) void submitProject();
        }}
        className="flex flex-col gap-3"
      >
        <Input
          autoFocus
          placeholder={t("createProjectWizard.titlePlaceholder")}
          value={title}
          onValueChange={setTitle}
          isDisabled={isWorking}
          variant="bordered"
        />

        <Textarea
          placeholder={t("createProjectWizard.descriptionPlaceholder")}
          value={description}
          onValueChange={setDescription}
          isDisabled={isWorking}
          variant="bordered"
          minRows={2}
        />

        <DatePicker
          label={t("createProjectWizard.startTime")}
          value={dateValue}
          onChange={handleDateChange}
          isDisabled={isWorking}
          variant="bordered"
          granularity="day"
          aria-label={t("createProjectWizard.dateAriaLabel")}
        />

        {members.length > 0 && (
          <Select
            label={t("createProjectWizard.assignees")}
            placeholder={t("createProjectWizard.selectAssignees")}
            selectionMode="multiple"
            selectedKeys={new Set(assignees)}
            onSelectionChange={(keys) => setAssignees([...keys].map(String))}
            isDisabled={isWorking}
            variant="bordered"
          >
            {members.map((m) => (
              <SelectItem key={m.user_id}>
                {m.display_name ?? m.user_id}
              </SelectItem>
            ))}
          </Select>
        )}

        {saveError && (
          <p className="text-sm text-danger">{saveError}</p>
        )}

        <Button
          type="submit"
          color="primary"
          isDisabled={!canSubmit}
          isLoading={isWorking}
        >
          {isWorking ? t("createProjectWizard.creating") : t("createProjectWizard.createButton")}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel — step router
// ---------------------------------------------------------------------------

export default function CreateProjectPanel() {
  const { step, cancelCreating } = useNewProject();
  const { closeDrawer } = useDrawer();
  const { t } = useLocale();

  const handleCancel = useCallback(() => {
    cancelCreating();
    closeDrawer();
  }, [cancelCreating, closeDrawer]);

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Step content */}
      {step === "pin" && <StepPin />}
      {step === "address" && <StepAddress />}
      {step === "customer" && <StepCustomer />}
      {step === "location" && <StepLocation />}
      {(step === "details" || step === "saving") && <StepDetails />}

      {/* Cancel */}
      {step !== "idle" && step !== "saving" && (
        <Button variant="flat" size="sm" onPress={handleCancel} className="mt-2">
          {t("createProjectWizard.cancel")}
        </Button>
      )}
    </div>
  );
}
