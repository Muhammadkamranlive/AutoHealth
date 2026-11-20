import Link from "next/link";
import type { AssignedFormTask } from "@/lib/forms/types";
import { Badge } from "@/components/ui";
import { ProfileProgressBar } from "@/components/dynamic-form/dynamic-form-renderer";

export function ProfileTasksCard({
  tasks,
  tasksHref,
  overallPercent,
  readOnly = false,
}: {
  tasks: AssignedFormTask[];
  tasksHref: string;
  overallPercent: number;
  readOnly?: boolean;
}) {
  if (tasks.length === 0) return null;

  const pending = tasks.filter((t) => !t.isComplete);
  const complete = tasks.length - pending.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-medical-600/10 to-teal-500/10 px-6 py-4 dark:from-medical-900/30 dark:to-teal-900/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-medical-900 dark:text-white">Profile tasks</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {complete}/{tasks.length} complete
              {pending.length > 0 && ` · ${pending.length} remaining`}
            </p>
          </div>
          {!readOnly && (
          <Link
            href={tasksHref}
            className="inline-flex items-center gap-1 rounded-xl bg-medical-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-medical-700"
          >
            View all
            <span aria-hidden>→</span>
          </Link>
          )}
        </div>
      </div>
      <div className="p-6">
        <ProfileProgressBar percent={overallPercent} />
        <ul className="mt-5 space-y-2">
          {tasks.slice(0, 3).map((task) => (
            <li key={task.template.id}>
              {readOnly ? (
                <div className="flex items-center gap-4 rounded-xl border border-medical-100 px-4 py-3.5 dark:border-slate-700">
                  <TaskStatusRing percent={task.completionPercent} complete={task.isComplete} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {task.template.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {task.isComplete ? "Submitted" : `${task.completionPercent}% complete`}
                    </p>
                  </div>
                  <Badge variant={task.isComplete ? "success" : "warning"}>
                    {task.isComplete ? "Done" : "In progress"}
                  </Badge>
                </div>
              ) : (
              <Link
                href={`${tasksHref}/${task.template.id}`}
                className="group flex items-center gap-4 rounded-xl border border-medical-100 px-4 py-3.5 transition hover:border-medical-300 hover:bg-medical-50/50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50"
              >
                <TaskStatusRing percent={task.completionPercent} complete={task.isComplete} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800 group-hover:text-medical-800 dark:text-slate-200 dark:group-hover:text-medical-300">
                    {task.template.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {task.isComplete ? "Submitted" : `${task.completionPercent}% complete`}
                  </p>
                </div>
                <Badge variant={task.isComplete ? "success" : "warning"}>
                  {task.isComplete ? "Done" : "Continue"}
                </Badge>
              </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ProfileTasksList({
  tasks,
  tasksHref,
}: {
  tasks: AssignedFormTask[];
  tasksHref: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-medical-200 bg-gradient-to-b from-medical-50/50 to-white p-16 text-center dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-100 text-2xl dark:bg-slate-800">
          ✓
        </div>
        <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">No profile forms assigned</p>
        <p className="mt-1 text-sm text-slate-500">Your administrator will assign forms when needed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Link
          key={task.template.id}
          href={`${tasksHref}/${task.template.id}`}
          className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-medical-200 hover:shadow-lg sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        >
          <div className="h-1.5 bg-gradient-to-r from-medical-500 to-teal-500 sm:hidden" style={{ width: `${task.completionPercent}%` }} />
          <div className="flex flex-1 items-start gap-4 p-5 sm:items-center">
            <TaskStatusRing percent={task.completionPercent} complete={task.isComplete} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-medical-900 group-hover:text-medical-700 dark:text-white dark:group-hover:text-medical-300">
                {task.template.title}
              </h3>
              {task.template.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {task.template.description}
                </p>
              )}
              <p className="mt-2 text-xs font-medium text-slate-400">
                ~{Math.max(1, Math.ceil((100 - task.completionPercent) / 15))} min remaining
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t border-medical-50 px-5 py-4 sm:border-l sm:border-t-0 sm:py-5 dark:border-slate-800">
            <div className="hidden w-28 sm:block">
              <div className="h-2 overflow-hidden rounded-full bg-medical-100 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-medical-500 to-teal-500 transition-all"
                  style={{ width: `${task.completionPercent}%` }}
                />
              </div>
              <p className="mt-1 text-center text-xs font-semibold tabular-nums text-slate-500">
                {task.completionPercent}%
              </p>
            </div>
            <Badge variant={task.isComplete ? "success" : "info"}>
              {task.isComplete ? "Complete" : "In progress"}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

function TaskStatusRing({
  percent,
  complete,
  size = "sm",
}: {
  percent: number;
  complete: boolean;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? 52 : 40;
  const stroke = 4;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-medical-100 dark:text-slate-700"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={complete ? "text-emerald-500" : "text-medical-600"}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-slate-600 dark:text-slate-300">
        {complete ? "✓" : `${percent}`}
      </span>
    </div>
  );
}
