"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  endNavigation,
  isInternalHref,
  startNavigation,
  subscribeNavigation,
  type NavigationState,
} from "@/lib/navigation/events";

function NavigationBanner({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-16 z-[90] w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 rounded-xl border border-medical-200 bg-white/95 px-4 py-3 shadow-lg shadow-medical-900/10 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
        <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-medical-200 border-t-medical-600 dark:border-slate-600 dark:border-t-medical-400" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {label ? `Opening ${label}…` : "Opening page…"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}

export function RouteProgress() {
  const pathname = usePathname();
  const [nav, setNav] = useState<NavigationState>({ navigating: false });
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeNavigation(setNav), []);

  // Complete navigation when route changes
  useEffect(() => {
    setProgress(100);
    const hide = setTimeout(() => {
      setVisible(false);
      endNavigation();
    }, 180);
    return () => clearTimeout(hide);
  }, [pathname]);

  // Animate progress while navigating
  useEffect(() => {
    if (!nav.navigating) return;

    setVisible(true);
    setProgress(8);

    const t1 = setTimeout(() => setProgress(35), 60);
    const t2 = setTimeout(() => setProgress(58), 180);
    const t3 = setTimeout(() => setProgress(78), 400);
    const t4 = setTimeout(() => setProgress(88), 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [nav.navigating]);

  const showBar = visible || nav.navigating;

  return (
    <>
      {showBar && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 bg-medical-100/80 dark:bg-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-medical-500 via-cyan-400 to-medical-600 shadow-[0_0_10px_rgba(37,99,235,0.45)] transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {nav.navigating && <NavigationBanner label={nav.label} />}
    </>
  );
}

/** Captures clicks on internal links site-wide for instant feedback. */
export function NavigationClickCapture() {
  const pathname = usePathname();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const anchor = (e.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!isInternalHref(href)) return;

      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname && !url.search) return;

      const label =
        anchor.getAttribute("data-nav-label") ??
        anchor.getAttribute("aria-label") ??
        anchor.textContent?.trim()?.slice(0, 40);

      startNavigation(label || undefined);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavigationClickCapture />
      <RouteProgress />
      {children}
    </>
  );
}
