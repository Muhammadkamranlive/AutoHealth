"use client";

import { BrandLogo } from "@/components/brand/logo";
import { NavLink } from "@/components/nav-link";
import { PageTransition } from "@/components/page-transition";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { flattenSimpleNav } from "@/lib/nav/search-items";
import { PortalNavSearch } from "@/components/portal-nav-search";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/notifications/notification-bell";

const navItems = [
  { href: "/partner", label: "Dashboard" },
  { href: "/partner/tasks", label: "Profile Tasks" },
  { href: "/partner/referrals", label: "Referrals" },
  { href: "/partner/refer", label: "Refer Client" },
  { href: "/partner/payouts", label: "Payouts" },
  { href: "/partner/profile", label: "Profile" },
];

export function PartnerShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-medical-50/30 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-medical-100 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <BrandLogo size="sm" showTagline tagline="Partners" />
          <PortalNavSearch
            items={flattenSimpleNav(navItems)}
            placeholder="Search partner portal…"
            className="order-last w-full min-w-0 flex-1 sm:order-none sm:max-w-md"
          />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              navLabel={item.label}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                pathname === item.href || (item.href !== "/partner" && pathname.startsWith(item.href))
                  ? "bg-medical-50 text-medical-700 dark:bg-slate-800 dark:text-medical-300"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
