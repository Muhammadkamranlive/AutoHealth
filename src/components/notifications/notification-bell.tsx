"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { markAllNotificationsRead, markNotificationRead } from "@/app/notifications/actions";
import type { AppNotification } from "@/lib/db";

function timeAgo(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      setItems([]);
      return;
    }

    setItems((data as AppNotification[] | null) ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();

    function onPointer(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const unread = items.filter((n) => !n.read_at).length;

  function handleOpenItem(item: AppNotification) {
    if (!item.read_at) {
      startTransition(async () => {
        await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
      });
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-medical-700 transition hover:bg-medical-50 dark:text-medical-300 dark:hover:bg-slate-800"
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-medical-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-medical-900 dark:text-white">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await markAllNotificationsRead();
                    setItems((prev) =>
                      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
                    );
                  })
                }
                className="text-xs font-semibold text-medical-600 hover:text-medical-800"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">No notifications yet</p>
            ) : (
              items.map((item) => {
                const inner = (
                  <div className="flex gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-slate-200 dark:bg-slate-700" : "bg-medical-500"}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-medical-900 dark:text-white">{item.title}</p>
                      {item.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.body}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">{timeAgo(item.created_at)}</p>
                    </div>
                  </div>
                );
                const className = `block w-full px-4 py-3 text-left transition hover:bg-medical-50 dark:hover:bg-slate-800 ${
                  item.read_at ? "" : "bg-medical-50/60 dark:bg-slate-800/40"
                }`;
                return item.href ? (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={className}
                    onClick={() => handleOpenItem(item)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    className={className}
                    onClick={() => handleOpenItem(item)}
                  >
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
