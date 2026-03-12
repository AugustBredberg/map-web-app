"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useDrawer } from "@/context/DrawerContext";

export default function Drawer() {
  const { isOpen, content, backdrop, closeDrawer } = useDrawer();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Touch tracking for swipe-to-dismiss
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, closeDrawer]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
      // Dismiss if swiped down more than 80 px and more vertical than horizontal
      if (dy > 80 && dy > dx) closeDrawer();
    },
    [closeDrawer]
  );

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop — visual only, never intercepts clicks so map remains interactive */}
      {backdrop && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={[
          // Base positioning – mobile: full-width bottom sheet
          "fixed bottom-0 left-0 right-0 z-50",
          // Mobile sizing
          "max-h-[85vh] overflow-y-auto",
          // Desktop overrides – full-height right panel
          "md:left-auto md:bottom-auto md:top-0 md:right-0 md:h-full md:max-h-none md:w-96",
          // Shape
          "rounded-t-2xl md:rounded-t-none md:rounded-l-2xl",
          // Background & shadow
          "bg-white shadow-2xl",
          // Smooth slide animation
          "transform transition-transform duration-300 ease-in-out",
          // Position state
          isOpen
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full",
        ].join(" ")}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle – visible on mobile only */}
        <div className="flex justify-center pb-1 pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Sticky header with close button */}
        <div className="sticky top-0 flex items-center justify-end border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={closeDrawer}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Dynamic content */}
        <div className="p-4">{content}</div>
      </div>
    </>,
    document.body
  );
}
