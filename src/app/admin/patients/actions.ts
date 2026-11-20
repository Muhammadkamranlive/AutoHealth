"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegisterPatientInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  assignedPhysicianId?: string;
};

async function linkPartnerReferral(
  adminClient: ReturnType<typeof createAdminClient>,
  email: string,
  patientId: string
) {
  const normalized = email.trim().toLowerCase();
  const { data: referrals } = await adminClient
    .from("partner_referrals")
    .select("id")
    .ilike("referred_email", normalized)
    .is("patient_id", null)
    .limit(1);

  if (referrals?.[0]) {
    await adminClient
      .from("partner_referrals")
      .update({
        patient_id: patientId,
        status: "enrolled",
        enrolled_at: new Date().toISOString(),
      })
      .eq("id", referrals[0].id);
  }
}

/** Staff registers a new patient account + clinical record. */
export async function registerPatient(input: RegisterPatientInput): Promise<string> {
  const supabase = await createClient();
  const staff = await requirePermission(supabase, "patients:create");

  const adminClient = createAdminClient();
  const email = input.email.trim().toLowerCase();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
    },
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Account creation failed");

  const userId = authData.user.id;

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: input.phone?.trim() || null,
      role: "patient",
    })
    .eq("id", userId);

  if (profileError) throw new Error(profileError.message);

  const { data: patientRow, error: patientFetchError } = await adminClient
    .from("patients")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (patientFetchError || !patientRow) {
    throw new Error("Patient record was not created. Ensure signup migrations are applied.");
  }

  const { error: patientError } = await adminClient
    .from("patients")
    .update({
      date_of_birth: input.dateOfBirth || null,
      address_line1: input.addressLine1?.trim() || null,
      address_line2: input.addressLine2?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      zip: input.zip?.trim() || null,
      assigned_physician_id: input.assignedPhysicianId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientRow.id);

  if (patientError) throw new Error(patientError.message);

  await linkPartnerReferral(adminClient, email, patientRow.id);

  await adminClient.rpc("write_audit_log", {
    p_action: "patient.registered",
    p_target_table: "patients",
    p_target_id: patientRow.id,
    p_metadata: {
      registered_by: staff.id,
      email,
      assigned_physician_id: input.assignedPhysicianId ?? null,
    },
  });

  revalidatePath("/admin/patients");
  return patientRow.id;
}

/** Self-service signup: enrich profile + patient row after auth account exists. */
export async function completeSelfRegistration(input: {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: input.phone?.trim() || null,
    })
    .eq("id", user.id);

  if (profileError) throw new Error(profileError.message);

  const { error: patientError } = await supabase
    .from("patients")
    .update({
      date_of_birth: input.dateOfBirth || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (patientError) throw new Error(patientError.message);

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (patient) {
    const adminClient = createAdminClient();
    await linkPartnerReferral(adminClient, user.email ?? "", patient.id);
  }

  revalidatePath("/dashboard");
}
