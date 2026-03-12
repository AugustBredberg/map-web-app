"use client";

import { useState, useEffect } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { useNewProject, PROJECT_STATUSES, type ProjectStatus } from "@/context/NewProjectContext";
import { useDrawer } from "@/context/DrawerContext";
import { useOrg } from "@/context/OrgContext";
import { supabase, type OrganizationMember } from "@/lib/supabase";

export default function CreateProjectForm() {
  const {
    title,
    setTitle,
    status,
    setStatus,
    startTime,
    setStartTime,
    assignees,
    setAssignees,
    location,
    isSaving,
    saveError,
    requestSubmit,
  } = useNewProject();

  const { closeDrawer } = useDrawer();
  const { activeOrg } = useOrg();

  const [members, setMembers] = useState<OrganizationMember[]>([]);

  useEffect(() => {
    if (!activeOrg) return;
    supabase
      .from("organization_members")
      .select("user_id, display_name, role")
      .eq("organization_id", activeOrg.organization_id)
      .then(({ data }) => {
        if (data) setMembers(data as OrganizationMember[]);
      });
  }, [activeOrg]);

  const canSubmit = title.trim().length > 0 && location !== null && !isSaving;

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) requestSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <Input
          autoFocus
          label="Title"
          placeholder="Enter project title"
          value={title}
          onValueChange={setTitle}
          isDisabled={isSaving}
          variant="bordered"
        />

        <Select
          label="Status"
          selectedKeys={new Set([String(status)])}
          onSelectionChange={(keys) => {
            if (typeof keys === "string") return;
            const key = [...keys][0] as string | undefined;
            if (key !== undefined) setStatus(Number(key) as ProjectStatus);
          }}
          isDisabled={isSaving}
          variant="bordered"
          disallowEmptySelection
        >
          {PROJECT_STATUSES.map((s) => (
            <SelectItem key={String(s.value)}>{s.label}</SelectItem>
          ))}
        </Select>

        <Input
          label="Start time"
          type="datetime-local"
          value={startTime}
          onValueChange={setStartTime}
          isDisabled={isSaving}
          variant="bordered"
          placeholder="Select date and time"
        />

        <Select
          label="Assignees"
          selectionMode="multiple"
          selectedKeys={new Set(assignees)}
          onSelectionChange={(keys) => {
            if (typeof keys === "string") return;
            setAssignees([...keys] as string[]);
          }}
          isDisabled={isSaving || members.length === 0}
          variant="bordered"
          placeholder={members.length === 0 ? "No members found" : "Select assignees"}
        >
          {members.map((m) => (
            <SelectItem key={m.user_id}>
              {m.display_name ?? m.user_id}
            </SelectItem>
          ))}
        </Select>

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
            Create Project
          </Button>
          <Button
            variant="light"
            onPress={closeDrawer}
            isDisabled={isSaving}
            fullWidth
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
