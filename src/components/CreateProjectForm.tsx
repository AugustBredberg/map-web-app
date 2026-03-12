"use client";

import { useNewProject } from "@/context/NewProjectContext";
import { useDrawer } from "@/context/DrawerContext";

export default function CreateProjectForm() {
  const {
    title,
    setTitle,
    location,
    isSaving,
    saveError,
    requestSubmit,
  } = useNewProject();

  const { closeDrawer } = useDrawer();

  const canSubmit = title.trim().length > 0 && location !== null && !isSaving;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-900">New Project</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) requestSubmit();
        }}
        className="flex flex-col gap-4"
      >
        {/* Title input */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input
            autoFocus
            type="text"
            placeholder="Enter project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </label>

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
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
          >
            {isSaving ? "Creating project…" : "Create Project"}
          </button>
          <button
            type="button"
            onClick={closeDrawer}
            disabled={isSaving}
            className="w-full rounded-lg py-2 text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
