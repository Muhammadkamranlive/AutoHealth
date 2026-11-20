"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/db";
import { requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCompletionPercent, isFormComplete } from "@/lib/forms/completion";
import { syncProfileCompletion } from "@/lib/forms/resolve";
import { parseFormSchema, slugify, type FormSchema, type FormResponses } from "@/lib/forms/types";
import { validateFormResponses, hasValidationErrors } from "@/lib/forms/validation";
import {
  createNotifications,
  taskAssignedNotification,
} from "@/lib/notifications";

export async function createFormTemplate(data: {
  title: string;
  description?: string;
  targetRoles: UserRole[];
  schema: FormSchema;
}) {
  const supabase = await createClient();
  const user = await requirePermission(supabase, "users:create");

  const admin = createAdminClient();
  const slug = slugify(data.title) + "-" + Date.now().toString(36).slice(-4);

  const { data: row, error } = await admin
    .from("profile_form_templates")
    .insert({
      title: data.title.trim(),
      slug,
      description: data.description?.trim() || null,
      target_roles: data.targetRoles,
      schema: data.schema as unknown as Record<string, unknown>,
      created_by: user.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/forms");
  return row.id as string;
}

export async function updateFormTemplate(
  id: string,
  data: {
    title: string;
    description?: string;
    targetRoles: UserRole[];
    schema: FormSchema;
    isActive: boolean;
  }
) {
  const supabase = await createClient();
  await requirePermission(supabase, "users:update");

  const admin = createAdminClient();
  const { error } = await admin
    .from("profile_form_templates")
    .update({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      target_roles: data.targetRoles,
      schema: data.schema as unknown as Record<string, unknown>,
      is_active: data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}`);
}

export async function deleteFormTemplate(id: string) {
  const supabase = await createClient();
  await requirePermission(supabase, "users:delete");

  const admin = createAdminClient();
  const { error } = await admin.from("profile_form_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/forms");
}

export async function assignFormToRole(formId: string, role: UserRole) {
  const supabase = await createClient();
  await requirePermission(supabase, "users:update");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profile_form_assignments")
    .select("id")
    .eq("form_id", formId)
    .eq("assignment_type", "role")
    .eq("role", role)
    .maybeSingle();

  if (!existing) {
    const { error } = await admin.from("profile_form_assignments").insert({
      form_id: formId,
      assignment_type: "role",
      role,
      user_id: null,
    });
    if (error) throw new Error(error.message);

    const [{ data: form }, { data: users }] = await Promise.all([
      admin.from("profile_form_templates").select("title").eq("id", formId).single(),
      admin.from("profiles").select("id, role").eq("role", role),
    ]);
    if (form && users?.length) {
      await createNotifications(
        users.map((u) => taskAssignedNotification(u.id, role, form.title, formId))
      );
    }
  }
  revalidatePath(`/admin/forms/${formId}`);
}

export async function assignFormToUser(formId: string, userId: string) {
  const supabase = await createClient();
  await requirePermission(supabase, "users:update");

  const admin = createAdminClient();
  const { error } = await admin.from("profile_form_assignments").insert({
    form_id: formId,
    assignment_type: "user",
    user_id: userId,
    role: null,
  });
  if (error) throw new Error(error.message);

  const [{ data: form }, { data: profile }] = await Promise.all([
    admin.from("profile_form_templates").select("title").eq("id", formId).single(),
    admin.from("profiles").select("id, role").eq("id", userId).single(),
  ]);
  if (form && profile) {
    await createNotifications([
      taskAssignedNotification(profile.id, profile.role as UserRole, form.title, formId),
    ]);
  }

  revalidatePath(`/admin/forms/${formId}`);
}

export async function removeFormAssignment(assignmentId: string, formId: string) {
  const supabase = await createClient();
  await requirePermission(supabase, "users:update");

  const admin = createAdminClient();
  await admin.from("profile_form_assignments").delete().eq("id", assignmentId);
  revalidatePath(`/admin/forms/${formId}`);
}

export async function saveFormSubmission(
  formId: string,
  responses: FormResponses,
  submit: boolean
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: template } = await supabase
    .from("profile_form_templates")
    .select("schema")
    .eq("id", formId)
    .single();

  if (!template) throw new Error("Form not found");

  const schema = parseFormSchema(template.schema);

  if (submit) {
    const validationErrors = validateFormResponses(schema, responses);
    if (hasValidationErrors(validationErrors)) {
      const first = Object.values(validationErrors)[0];
      throw new Error(first ?? "Please fix validation errors before submitting");
    }
  }

  const completionPercent = calculateCompletionPercent(schema, responses);
  const complete = isFormComplete(schema, responses);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const status = submit && complete ? "submitted" : "draft";

  const { error } = await supabase.from("profile_form_submissions").upsert(
    {
      form_id: formId,
      user_id: user.id,
      responses,
      status,
      completion_percent: completionPercent,
      submitted_at: status === "submitted" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "form_id,user_id" }
  );

  if (error) throw new Error(error.message);

  if (profile?.role) {
    await syncProfileCompletion(supabase, user.id, profile.role as UserRole);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/partner");
  revalidatePath("/profile/tasks");

  return { completionPercent, submitted: status === "submitted" };
}
