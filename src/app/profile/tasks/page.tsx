import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import { createClient } from "@/lib/supabase/server";
import { PatientShell } from "@/components/patient-shell";
import { ProfileTasksList } from "@/components/profile-tasks/profile-tasks";
import { ProfileProgressBar } from "@/components/dynamic-form/dynamic-form-renderer";

export default async function PatientTasksPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const tasks = await getAssignedFormsForUser(supabase, user.id, user.role);
  const overall = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.completionPercent, 0) / tasks.length)
    : 0;

  return (
    <PatientShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile tasks</h1>
          <p className="text-slate-500">Complete your assigned profile forms</p>
        </div>
        {tasks.length > 0 && <ProfileProgressBar percent={overall} />}
        <ProfileTasksList tasks={tasks} tasksHref="/profile/tasks" />
      </div>
    </PatientShell>
  );
}
