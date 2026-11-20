"use client";

import { useState } from "react";
import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { PATIENT_NAV, PATIENT_WORKSPACE_TITLE } from "@/lib/patient/nav-config";
import { flattenSimpleNav } from "@/lib/nav/search-items";
import { PortalNavSearch } from "@/components/portal-nav-search";
import { PageTransition } from "@/components/page-transition";
import { PatientSidebar } from "@/components/patient/patient-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { IconMenu } from "@/components/admin/admin-icons";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function PatientShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ThemeProvider>
    <div className="flex min-h-screen min-h-[100dvh] bg-medical-50/50 dark:bg-slate-950">
      <PatientSidebar
        user={user}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-medical-100 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 sm:max-w-[240px]">
              <button
                type="button"
                className="touch-target rounded-xl text-medical-600 lg:hidden dark:text-medical-400"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
              >
                <IconMenu className="h-5 w-5" />
              </button>
              <div className="min-w-0 hidden sm:block">
                <p className="truncate text-xs font-semibold uppercase tracking-wider text-medical-500 dark:text-medical-400">
                  {PATIENT_WORKSPACE_TITLE}
                </p>
                <p className="truncate text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
              </div>
            </div>

            <PortalNavSearch
              items={flattenSimpleNav(PATIENT_NAV.map((n) => ({ href: n.href, label: n.label })))}
              placeholder="Search patient portal…"
              className="order-last w-full min-w-0 flex-1 sm:order-none sm:max-w-xl lg:max-w-2xl"
            />

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell />
              <ThemeToggle />
              <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:flex dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Care active
              </span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-medical-600 text-xs font-bold text-white">
                {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="page-container py-6 sm:py-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
}
