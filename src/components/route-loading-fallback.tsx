import { CircularLoader } from "@/components/ui";

/** Shown while a route segment loads — keeps layout visible, confirms click worked. */
export function RouteLoadingFallback() {
  return (
    <div
      className="flex min-h-[45vh] flex-col items-center justify-center gap-4 py-16"
      role="status"
      aria-live="polite"
    >
      <CircularLoader />
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Opening page…</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your click was received — loading now</p>
      </div>
    </div>
  );
}
