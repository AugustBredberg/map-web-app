"use client";

import { useState, useEffect } from "react";
import { Button, Chip, DatePicker, Input, Select, SelectItem, Textarea, TimeInput } from "@heroui/react";
import { CalendarDate, Time, toZoned, getLocalTimeZone } from "@internationalized/date";
import type { TimeValue } from "@react-types/datepicker";
import { useNewProject } from "@/context/NewProjectContext";
import { useDrawer } from "@/context/DrawerContext";
import { useOrg } from "@/context/OrgContext";
import { getOrgMembers } from "@/lib/members";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProjectStatusSelect from "@/components/ProjectStatusSelect";
import ProjectEstimatedTimeSelect from "@/components/ProjectEstimatedTimeSelect";
import type { OrganizationMember } from "@/lib/supabase";

export default function CreateProjectForm({ mode = "create" }: { mode?: "create" | "edit" }) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    estimatedTime,
    setEstimatedTime,
    status,
    setStatus,
    startTime,
    setStartTime,
    assignees,
    setAssignees,
    location,
    isSaving,
    saveError,
    submitProject,
    isDeleting,
    deleteError,
    deleteProject,
  } = useNewProject();

  const { closeDrawer } = useDrawer();
  const { activeOrg, activeRole } = useOrg();

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!activeOrg) return;
    getOrgMembers(activeOrg.organization_id).then(({ data }) => {
      if (data) setMembers(data);
    });
  }, [activeOrg]);

  const memberIds = new Set(members.map((m) => m.user_id));

  const canSubmit = title.trim().length > 0 && location !== null && !isSaving;

  const dateValue = startTime
    ? new CalendarDate(startTime.year, startTime.month, startTime.day)
    : null;
  const timeValue = startTime ? new Time(startTime.hour, startTime.minute) : null;

  const handleDateChange = (date: CalendarDate | null) => {
    if (!date) { setStartTime(null); return; }
    const h = startTime?.hour ?? 9;
    const m = startTime?.minute ?? 0;
    setStartTime(toZoned(date, getLocalTimeZone()).set({ hour: h, minute: m }));
  };

  const handleTimeChange = (time: TimeValue | null) => {
    if (!time || !dateValue) return;
    setStartTime(toZoned(dateValue, getLocalTimeZone()).set({ hour: time.hour, minute: time.minute }));
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) submitProject();
        }}
        className="flex flex-col gap-4"
      >
        <Input
          autoFocus
          placeholder="Kundnamn"
          value={title}
          onValueChange={setTitle}
          isDisabled={isSaving}
          variant="bordered"
        />

        <Textarea
          placeholder="Enter project description"
          value={description}
          onValueChange={setDescription}
          isDisabled={isSaving}
          variant="bordered"
          minRows={3}
        />

        {/* Location picker status */}
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
            location
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {location ? (
            <>
              <svg
                className="h-4 w-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Location selected</span>
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4 shrink-0"
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
              <span>Click on the map to set a location</span>
            </>
          )}
        </div>

        <ProjectEstimatedTimeSelect
          value={estimatedTime}
          onChange={setEstimatedTime}
          isDisabled={isSaving}
        />

        <ProjectStatusSelect
          value={status}
          onChange={setStatus}
          isDisabled={isSaving}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Start time</span>
          <div className="flex gap-2">
            <DatePicker
              aria-label="Date"
              variant="bordered"
              showMonthAndYearPickers
              granularity="day"
              value={dateValue}
              onChange={handleDateChange}
              isDisabled={isSaving}
              className="flex-1"
            />
            <TimeInput
              aria-label="Time"
              variant="bordered"
              hourCycle={24}
              value={timeValue}
              onChange={handleTimeChange}
              isDisabled={isSaving || !dateValue}
              className="flex-1"
            />
          </div>
        </div>

        <Select
          classNames={{ trigger: "min-h-10 py-2" }}
          isMultiline
          label="Assignees"
          selectionMode="multiple"
          selectedKeys={new Set(assignees.filter((id) => memberIds.has(id)))}
          onSelectionChange={(keys) => {
            if (typeof keys === "string") return;
            setAssignees([...keys] as string[]);
          }}
          isDisabled={isSaving || members.length === 0}
          labelPlacement="outside"
          variant="bordered"
          placeholder={members.length === 0 ? "No members found" : "Select assignees"}
          renderValue={(items) => (
            <div className="flex flex-wrap gap-1">
              {items.map((item) => (
                <Chip key={item.key} size="sm">{item.textValue}</Chip>
              ))}
            </div>
          )}
        >
          {members.map((m) => (
            <SelectItem key={m.user_id} textValue={m.display_name ?? m.user_id}>
              {m.display_name ?? m.user_id}
            </SelectItem>
          ))}
        </Select>

        {/* Save error */}
        {saveError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {saveError}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            color="primary"
            isDisabled={!canSubmit}
            isLoading={isSaving}
            fullWidth
          >
            {mode === "edit" ? "Confirm" : "Create Project"}
          </Button>
          {mode === "edit" && activeRole === "admin" && (
            <Button
              color="danger"
              variant="flat"
              onPress={() => setShowDeleteConfirm(true)}
              isDisabled={isSaving || isDeleting}
              fullWidth
            >
              Delete Project
            </Button>
          )}
          <Button
            variant="light"
            onPress={closeDrawer}
            isDisabled={isSaving || isDeleting}
            fullWidth
          >
            Cancel
          </Button>
        </div>
      </form>

      {mode === "edit" && activeRole === "admin" && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete project"
          message="This will permanently delete the project and all its data. This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            setShowDeleteConfirm(false);
            deleteProject();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isDeleting}
        />
      )}

      {deleteError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {deleteError}
        </p>
      )}
    </div>
  );
}
