"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Button } from "@heroui/react";
import { useDrawer } from "@/context/DrawerContext";

export default function Drawer() {
  const { isOpen, content, contentKey, backdrop, title, closeDrawer } = useDrawer();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Close when navigating away
  useEffect(() => {
    closeDrawer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
          // Mobile sizing – flex column so header stays fixed and content scrolls
          "flex flex-col max-h-[60vh]",
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
      >
        {/* Header */}
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
          {title && <span className="text-base font-semibold text-gray-900">{title}</span>}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={closeDrawer}
            aria-label="Close"
            className="text-gray-400"
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
          </Button>
        </div>

        {/* Dynamic content */}
        <div key={contentKey} className="overflow-y-auto p-4">{content}</div>
      </div>
    </>,
    document.body
  );
}
