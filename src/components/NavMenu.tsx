"use client";

import { useState } from "react";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [{ label: "Map", href: "/map" }];

export default function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:bg-gray-900 md:text-white">
        <div className="flex h-14 items-center border-b border-gray-700 px-4">
          <span className="text-lg font-semibold">Map Web App</span>
        </div>
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile header with hamburger */}
      <header className="flex h-14 items-center justify-between bg-gray-900 px-4 text-white md:hidden">
        <span className="text-lg font-semibold">Map Web App</span>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-md p-2 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {open ? (
            /* X icon */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile dropdown menu */}
      {open && (
        <nav className="bg-gray-900 text-white md:hidden">
          <ul className="space-y-1 px-2 py-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
