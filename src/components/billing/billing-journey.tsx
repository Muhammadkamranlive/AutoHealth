import type { PatientBillingState } from "@/lib/billing/plans";
import { BILLING_JOURNEY_STEPS } from "@/lib/billing/plans";
import { cn } from "@/components/ui";

function activeStep(state: PatientBillingState): number {
  switch (state.step) {
    case "intake":
      return 1;
    case "awaiting_plan":
      return 2;
    case "ready_to_pay":
    case "renew":
      return 3;
    case "active":
      return 4;
  }
}

export function BillingJourney({ state }: { state: PatientBillingState }) {
  const current = activeStep(state);

  return (
    <div className="rounded-2xl border border-medical-100 bg-gradient-to-br from-medical-50/80 to-white p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-medical-700 dark:text-medical-300">
        How billing works
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        You only pay after your physician assigns treatment — not before.
      </p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BILLING_JOURNEY_STEPS.map((step) => {
          const done = step.id < current;
          const active = step.id === current;

          return (
            <li
              key={step.id}
              className={cn(
                "rounded-xl border p-4 transition",
                active && "border-medical-400 bg-white shadow-sm dark:border-medical-600 dark:bg-slate-900",
                done && "border-medical-200 bg-medical-50/50 opacity-80 dark:border-slate-700",
                !done && !active && "border-slate-200 bg-white/50 dark:border-slate-800"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    done && "bg-medical-600 text-white",
                    active && "bg-medical-100 text-medical-800 ring-2 ring-medical-500 dark:bg-medical-900 dark:text-medical-200",
                    !done && !active && "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  )}
                >
                  {done ? "✓" : step.id}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{step.label}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{step.detail}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
