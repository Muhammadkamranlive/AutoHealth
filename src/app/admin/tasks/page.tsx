import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import { createClient } from "@/lib/supabase/server";
import { ProfileTasksList } from "@/components/profile-tasks/profile-tasks";
import { ProfileProgressBar } from "@/components/dynamic-form/dynamic-form-renderer";

export default async function AdminTasksPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const tasks = await getAssignedFormsForUser(supabase, user.id, user.role);
  const overall = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.completionPercent, 0) / tasks.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">Profile tasks</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Complete assigned profile forms</p>
      </div>
      {tasks.length > 0 && <ProfileProgressBar percent={overall} />}
      <ProfileTasksList tasks={tasks} tasksHref="/admin/tasks" />
      <Link href="/admin" className="text-sm font-medium text-medical-600 hover:text-medical-700">← Back to dashboard</Link>
    </div>
  );
}
