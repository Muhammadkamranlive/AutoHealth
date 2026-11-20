"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  filterNavSearchItems,
  type NavSearchItem,
} from "@/lib/nav/search-items";
import { startNavigation } from "@/lib/navigation/events";
import { cn } from "@/components/ui/lib/utils";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

type PortalNavSearchProps = {
  items: NavSearchItem[];
  placeholder?: string;
  className?: string;
};

export function PortalNavSearch({
  items,
  placeholder = "Search menus…",
  className,
}: PortalNavSearchProps) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = filterNavSearchItems(items, query);

  const navigate = useCallback(
    (item: NavSearchItem) => {
      setOpen(false);
      setQuery("");
      startNavigation(item.label);
      router.push(item.href);
    },
    [router]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) navigate(item);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-500 dark:text-medical-400" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          className={cn(
            "w-full min-h-11 rounded-xl border border-medical-200 bg-medical-50/50 py-2.5 pl-10 pr-16",
            "text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition",
            "focus:border-medical-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-medical-500/20",
            "dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500",
            "dark:focus:border-medical-400 dark:focus:bg-slate-900"
          )}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-medical-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500">
          ⌘K
        </kbd>
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-medical-100 bg-white py-1 shadow-lg shadow-medical-900/10 dark:border-slate-700 dark:bg-slate-900"
        >
          {results.map((item, index) => (
            <li key={item.id} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigate(item)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left transition",
                  index === activeIndex
                    ? "bg-medical-50 text-medical-900 dark:bg-slate-800 dark:text-white"
                    : "text-slate-700 hover:bg-medical-50/70 dark:text-slate-200 dark:hover:bg-slate-800/70"
                )}
              >
                <span className="text-sm font-medium">{item.label}</span>
                {item.group && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.group}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-medical-100 bg-white px-3.5 py-3 text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No menus match &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
