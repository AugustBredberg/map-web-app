"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";

const navItems = [
  {
    label: "Map",
    href: "/map",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 012.553-1.923L9 5m0 15l6-3m-6 3V5m6 12l5.447 2.724A2 2 0 0021 17.618V7.618a2 2 0 00-2.553-1.923L15 8m0 9V8M9 5l6-3" />
      </svg>
    ),
  },
];

const settingsIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const collapseIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
  </svg>
);

const expandIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
  </svg>
);

export default function NavMenu() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { activeOrg } = useOrg();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:bg-gray-900 md:text-white transition-all duration-200 ${
          collapsed ? "md:w-14" : "md:w-56"
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-700 px-3">
          {!collapsed && (
            <span className="truncate text-lg font-semibold">Map Web App</span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? "justify-center" : ""}`}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 px-2 py-3">
          {!collapsed && activeOrg && (
            <p className="mb-2 truncate px-2 text-xs text-gray-400">
              {activeOrg.name}
            </p>
          )}
          <Link
            href="/settings"
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? "justify-center" : ""}`}
          >
            {settingsIcon}
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`mt-1 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? "justify-center" : ""}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? expandIcon : collapseIcon}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile header with hamburger */}
      <header className="flex h-14 items-center justify-between bg-gray-900 px-4 text-white md:hidden">
        <span className="text-lg font-semibold">Map Web App</span>
        <Button
          isIconOnly
          variant="light"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onPress={() => setMobileOpen((prev) => !prev)}
          className="text-white hover:bg-gray-700"
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </Button>
      </header>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <nav className="bg-gray-900 text-white md:hidden">
          <ul className="space-y-1 px-2 py-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {settingsIcon}
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}

