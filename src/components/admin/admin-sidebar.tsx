"use client";

import { NavLink } from "@/components/nav-link";
import { BrandLogo, BrandMark } from "@/components/brand/logo";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleDisplayName, type SessionUser } from "@/lib/auth";
import type { ResolvedNavItem } from "@/lib/menus/types";
import { createClient } from "@/lib/supabase/client";
import {
  ADMIN_NAV_ICONS,
  IconChevron,
  IconLogout,
  IconMenu,
  IconShield,
} from "./admin-icons";

const STORAGE_KEY = "admin-sidebar-collapsed";

const EXTRA_ICONS: Record<string, typeof IconShield> = {
  users: IconShield,
  roles: IconShield,
};

type AdminSidebarProps = {
  user: SessionUser;
  navItems: ResolvedNavItem[];
  workspaceTitle: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function AdminSidebar({
  user,
  navItems,
  workspaceTitle,
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    const active = navItems.filter(
      (item) =>
        pathname === item.href ||
        (item.href !== "/admin" && pathname.startsWith(item.href)) ||
        item.children?.some((c) => pathname.startsWith(c.href.split("?")[0]))
    );
    setOpenGroups(new Set(active.map((i) => i.id)));
  }, [pathname, navItems]);

  useEffect(() => {
    onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close drawer on route change only
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  function toggleGroup(id: string) {
    if (collapsed) return;
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-medical-100 px-3 dark:border-slate-800">
        <NavLink href="/admin" navLabel="Dashboard" className="flex min-w-0 items-center gap-2.5 overflow-hidden" onClick={onMobileClose}>
          {collapsed ? (
            <BrandMark size="sm" />
          ) : (
            <BrandLogo size="sm" showTagline tagline={workspaceTitle} />
          )}
        </NavLink>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-medical-500 transition hover:bg-medical-50 hover:text-medical-700 lg:flex dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IconMenu className={`h-4 w-4 transition ${collapsed ? "" : "rotate-90"}`} />
        </button>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="touch-target rounded-lg text-medical-500 lg:hidden dark:text-slate-400"
            aria-label="Close navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const Icon =
            ADMIN_NAV_ICONS[item.icon] ??
            EXTRA_ICONS[item.id] ??
            ADMIN_NAV_ICONS.dashboard;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openGroups.has(item.id);

          return (
            <div key={item.id}>
              <div className="flex items-center">
                <NavLink
                  href={item.href}
                  navLabel={item.label}
                  title={collapsed ? item.label : undefined}
                  onClick={onMobileClose}
                  className={`flex min-h-11 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-medical-600 text-white shadow-md shadow-medical-600/20 dark:bg-medical-500"
                      : "text-slate-600 hover:bg-medical-50 hover:text-medical-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-medical-500 dark:text-medical-400"}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
                {!collapsed && hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.id)}
                    className={`mr-1 flex h-9 w-9 items-center justify-center rounded-lg transition ${
                      active ? "text-white/80 hover:bg-medical-500" : "text-slate-400 hover:bg-medical-50 dark:hover:bg-slate-800"
                    }`}
                    aria-label={`Toggle ${item.label} submenu`}
                  >
                    <IconChevron className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {!collapsed && hasChildren && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-medical-100 pl-3 dark:border-slate-700">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href.split("?")[0];
                        return (
                          <NavLink
                            key={child.href}
                            href={child.href}
                            navLabel={child.label}
                            onClick={onMobileClose}
                            className={`block min-h-10 rounded-lg px-3 py-2 text-xs font-medium transition ${
                              childActive
                                ? "bg-medical-50 text-medical-700 dark:bg-slate-800 dark:text-medical-300"
                                : "text-slate-500 hover:bg-medical-50/70 hover:text-medical-600 dark:text-slate-400 dark:hover:bg-slate-800"
                            }`}
                          >
                            {child.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-medical-100 p-3 dark:border-slate-800">
        {!collapsed ? (
          <div className="rounded-xl bg-medical-50 p-3 dark:bg-slate-800">
            <p className="truncate text-sm font-semibold text-medical-900 dark:text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-medical-600 dark:text-medical-400">{getRoleDisplayName(user.role)}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-medical-200 bg-white px-3 py-2 text-xs font-medium text-medical-700 transition hover:bg-medical-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <IconLogout className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className="flex w-full items-center justify-center rounded-xl p-2.5 text-medical-500 transition hover:bg-medical-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <IconLogout className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`relative z-20 hidden shrink-0 flex-col border-r border-medical-100 bg-white shadow-sm transition-[width] duration-300 lg:flex dark:border-slate-800 dark:bg-slate-900 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
              aria-label="Close navigation menu"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-medical-100 bg-white shadow-xl lg:hidden dark:border-slate-800 dark:bg-slate-900"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
