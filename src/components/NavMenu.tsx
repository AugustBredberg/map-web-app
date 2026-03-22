"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { hasMinRole } from "@/lib/supabase";

const navItems = [
  {
    labelKey: "nav.map",
    href: "/map",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 012.553-1.923L9 5m0 15l6-3m-6 3V5m6 12l5.447 2.724A2 2 0 0021 17.618V7.618a2 2 0 00-2.553-1.923L15 8m0 9V8M9 5l6-3" />
      </svg>
    ),
  },
  {
    labelKey: "nav.projects",
    href: "/projects",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    labelKey: "nav.settings",
    href: "/settings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const financialItem = {
  labelKey: "nav.financial",
  href: "/financial",
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

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

export default function NavMenu({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("navCollapsed") === "true";
  });
  const { activeOrg, activeRole } = useOrg();
  const { systemRole } = useAuth();
  const pathname = usePathname();
  const { t } = useLocale();

  const showFinancial =
    (!!activeOrg && hasMinRole(activeRole, "admin")) || systemRole === "dev";

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("navCollapsed", String(next));
      return next;
    });
  };

  const settingsItem = navItems.find((item) => item.href === "/settings")!;
  const sidebarItems = navItems.filter((item) => item.href !== "/settings");
  const allSidebarItems = showFinancial
    ? [...sidebarItems, financialItem]
    : sidebarItems;
  const allMobileItems = showFinancial
    ? [navItems[0], navItems[1], financialItem, navItems[2]]
    : navItems;

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col bg-sidebar-bg text-sidebar-fg transition-all duration-200 ${
          collapsed ? "md:w-14" : "md:w-56"
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3">
          {!collapsed && (
            <span className="truncate text-lg font-semibold">{t("nav.appName")}</span>
          )}
        </div>
        <div className="mx-3 border-b-2 border-border" />

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {allSidebarItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? "justify-center" : ""} ${
                      isActive
                        ? "bg-sidebar-active text-white"
                        : "text-sidebar-fg hover:bg-sidebar-hover"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.icon}
                    {!collapsed && <span>{t(item.labelKey)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-2 py-3">
          {!collapsed && activeOrg && (
            <p className="mb-2 truncate px-2 text-xs text-sidebar-muted">
              {activeOrg.name}
            </p>
          )}
          <Link
            href={settingsItem.href}
            title={collapsed ? t(settingsItem.labelKey) : undefined}
            className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? "justify-center" : ""} ${
              pathname.startsWith(settingsItem.href)
                ? "bg-sidebar-active text-white"
                : "text-sidebar-fg/70 hover:bg-sidebar-hover hover:text-sidebar-fg"
            }`}
            aria-current={pathname.startsWith(settingsItem.href) ? "page" : undefined}
          >
            {settingsItem.icon}
            {!collapsed && <span>{t(settingsItem.labelKey)}</span>}
          </Link>
          <button
            onClick={toggleCollapsed}
            className={`mt-1 flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? "justify-center" : ""}`}
            aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
          >
            {collapsed ? expandIcon : collapseIcon}
            {!collapsed && <span>{t("nav.collapse")}</span>}
          </button>
        </div>
      </aside>

      {/* Page content */}
      {children}

      {/* Mobile bottom tab bar */}
      <nav className="shrink-0 bg-sidebar-bg md:hidden">
        <ul className="flex items-center justify-around">
          {allMobileItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center py-2 text-xs font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${
                    isActive ? "text-sidebar-fg" : "text-sidebar-muted hover:text-sidebar-fg"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${isActive ? "bg-sidebar-active text-white" : ""}`}>
                    {item.icon}
                    <span>{t(item.labelKey)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

