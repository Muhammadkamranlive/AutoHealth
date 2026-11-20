import type { UserRole } from "@/lib/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateCompletionPercent, aggregateProfileCompletion } from "./completion";
import { parseFormSchema, type AssignedFormTask, type ProfileFormTemplate } from "./types";

export async function getAssignedFormsForUser(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<AssignedFormTask[]> {
  const { data: templates } = await supabase
    .from("profile_form_templates")
    .select("*")
    .eq("is_active", true);

  if (!templates?.length) return [];

  const { data: assignments } = await supabase
    .from("profile_form_assignments")
    .select("form_id, assignment_type, role, user_id");

  const { data: submissions } = await supabase
    .from("profile_form_submissions")
    .select("*")
    .eq("user_id", userId);

  const submissionMap = new Map(submissions?.map((s) => [s.form_id, s]) ?? []);
  const assignedFormIds = new Set<string>();

  for (const a of assignments ?? []) {
    if (a.assignment_type === "role" && a.role === role) {
      assignedFormIds.add(a.form_id);
    }
    if (a.assignment_type === "user" && a.user_id === userId) {
      assignedFormIds.add(a.form_id);
    }
  }

  const tasks: AssignedFormTask[] = [];

  for (const row of templates as ProfileFormTemplate[]) {
    const byAssignment = assignedFormIds.has(row.id);
    const byTargetRole = row.target_roles?.includes(role);
    if (!byAssignment && !byTargetRole) continue;

    const schema = parseFormSchema(row.schema);
    const submission = submissionMap.get(row.id) ?? null;
    const responses = (submission?.responses ?? {}) as Record<string, unknown>;
    const completionPercent = submission?.completion_percent ??
      calculateCompletionPercent(schema, responses as never);

    tasks.push({
      template: { ...row, schema },
      submission,
      completionPercent,
      isComplete: submission?.status === "submitted" || completionPercent === 100,
    });
  }

  return tasks.sort((a, b) => a.template.title.localeCompare(b.template.title));
}

export async function syncProfileCompletion(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<number> {
  const tasks = await getAssignedFormsForUser(supabase, userId, role);
  const percent = aggregateProfileCompletion(tasks);
  const allComplete = tasks.length > 0 && tasks.every((t) => t.isComplete);

  await supabase
    .from("profiles")
    .update({
      profile_completion_percent: percent,
      profile_completed_at: allComplete ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return percent;
}
