/** Default refill cadence when client rules are not configured. */
export const REFILL_CADENCE_DAYS = 28;

/** Grace period after plan start before first refill is allowed. */
export const FIRST_REFILL_GRACE_DAYS = 7;

export type RefillEligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string };

type OrderRow = {
  status: string;
  is_refill: boolean;
  created_at: string;
  reviewed_at: string | null;
};

type PlanRow = {
  id: string;
  start_date: string;
};

export function checkRefillEligibility(
  activePlan: PlanRow | null,
  orders: OrderRow[],
  now = new Date()
): RefillEligibilityResult {
  if (!activePlan) {
    return { eligible: false, reason: "You need an active treatment plan to request a refill." };
  }

  const pendingRefill = orders.find(
    (o) => o.is_refill && o.status === "pending_review"
  );
  if (pendingRefill) {
    return {
      eligible: false,
      reason: "You already have a refill request awaiting review.",
    };
  }

  const approvedRefills = orders
    .filter((o) => o.is_refill && o.status === "approved")
    .sort((a, b) => {
      const aDate = a.reviewed_at ?? a.created_at;
      const bDate = b.reviewed_at ?? b.created_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  if (approvedRefills.length === 0) {
    const planStart = new Date(activePlan.start_date + "T12:00:00");
    const daysSinceStart = daysBetween(planStart, now);
    if (daysSinceStart < FIRST_REFILL_GRACE_DAYS) {
      return {
        eligible: false,
        reason: `Your first refill is available ${FIRST_REFILL_GRACE_DAYS - daysSinceStart} day(s) after plan start.`,
      };
    }
    return { eligible: true };
  }

  const lastApproved = approvedRefills[0];
  const lastDate = new Date((lastApproved.reviewed_at ?? lastApproved.created_at).slice(0, 10) + "T12:00:00");
  const daysSinceLast = daysBetween(lastDate, now);

  if (daysSinceLast < REFILL_CADENCE_DAYS) {
    const daysRemaining = REFILL_CADENCE_DAYS - daysSinceLast;
    return {
      eligible: false,
      reason: `Next refill available in ${daysRemaining} day(s) (${REFILL_CADENCE_DAYS}-day cadence).`,
    };
  }

  return { eligible: true };
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
