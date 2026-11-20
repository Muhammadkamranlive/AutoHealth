"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/auth/errors";

function PermissionAlertInner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error !== "no_permission") return null;

  return (
    <div
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
      role="alert"
    >
      {PERMISSION_DENIED_MESSAGE}
    </div>
  );
}

export function PermissionAlert() {
  return (
    <Suspense>
      <PermissionAlertInner />
    </Suspense>
  );
}
