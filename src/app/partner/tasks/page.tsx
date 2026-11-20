import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import { createClient } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner-shell";
import { ProfileTasksList } from "@/components/profile-tasks/profile-tasks";
import { ProfileProgressBar } from "@/components/dynamic-form/dynamic-form-renderer";

export default async function PartnerTasksPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const tasks = await getAssignedFormsForUser(supabase, user.id, user.role);
  const overall = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.completionPercent, 0) / tasks.length)
    : 0;

  return (
    <PartnerShell user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profile tasks</h1>
        {tasks.length > 0 && <ProfileProgressBar percent={overall} />}
        <ProfileTasksList tasks={tasks} tasksHref="/partner/tasks" />
      </div>
    </PartnerShell>
  );
}
