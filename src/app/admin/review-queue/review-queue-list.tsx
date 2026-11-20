"use client";

import { useState, useTransition } from "react";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/auth/errors";
import type { SessionUser } from "@/lib/auth";
import { Badge, Button, LoadingOverlay, Textarea, orderStatusBadge } from "@/components/ui";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-context";
import { approveOrder, denyOrder } from "./actions";

interface ReviewQueueItem {
  id: string;
  status: string;
  is_refill: boolean;
  created_at: string;
  patient: {
    id: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    } | null;
  } | null;
  treatment_plan: {
    medication: string;
  } | null;
}

export function ReviewQueueList({
  orders,
  user: _user,
}: {
  orders: ReviewQueueItem[];
  user: SessionUser;
}) {
  const { can } = useAdminWorkspace();
  const canApprove = can("orders:approve");

  return (
    <div className="space-y-4">
      {!canApprove && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          View-only access — you can browse orders but cannot approve or deny. {PERMISSION_DENIED_MESSAGE}
        </p>
      )}
      {orders.map((order) => (
        <ReviewQueueCard key={order.id} order={order} canApprove={canApprove} />
      ))}
    </div>
  );
}

function ReviewQueueCard({
  order,
  canApprove,
}: {
  order: ReviewQueueItem;
  canApprove: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [error, setError] = useState("");

  const profile = order.patient?.profiles;
  const waitHours = Math.round(
    (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)
  );

  function handleApprove() {
    setError("");
    startTransition(async () => {
      try {
        await approveOrder(order.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to approve");
      }
    });
  }

  function handleDeny() {
    setError("");
    startTransition(async () => {
      try {
        await denyOrder(order.id, denyReason);
        setShowDenyForm(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to deny");
      }
    });
  }

  return (
    <>
      <LoadingOverlay active={isPending} message="saving" />
      <div className="rounded-2xl border border-medical-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-medical-900 dark:text-white">
                {profile?.first_name} {profile?.last_name}
              </h3>
              <Badge variant={orderStatusBadge(order.status)}>
                {order.status.replace("_", " ")}
              </Badge>
              {order.is_refill && <Badge variant="info">Refill</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-500">{profile?.email}</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              <span className="text-slate-500">Medication:</span>{" "}
              {order.treatment_plan?.medication ?? "Unknown"}
            </p>
            <p className="text-sm text-slate-400">
              Submitted {new Date(order.created_at).toLocaleString()} ({waitHours}h ago)
            </p>
          </div>

          {canApprove && order.status === "pending_review" && (
            <div className="flex shrink-0 gap-2">
              {!showDenyForm ? (
                <>
                  <Button size="sm" onClick={handleApprove} disabled={isPending}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setShowDenyForm(true)}
                    disabled={isPending}
                  >
                    Deny
                  </Button>
                </>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:w-56">
                  <Textarea
                    placeholder="Reason for denial (required)"
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleDeny}
                      disabled={isPending || !denyReason.trim()}
                    >
                      Confirm Deny
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowDenyForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
