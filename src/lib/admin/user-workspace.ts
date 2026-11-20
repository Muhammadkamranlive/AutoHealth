import {
  getPortalForRole,
  getRoleDisplayName,
  type SessionUser,
  type UserRole,
} from "@/lib/auth";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import { resolveAdminWorkspace } from "@/lib/menus/resolve";
import { PATIENT_NAV } from "@/lib/patient/nav-config";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Document,
  MessageThread,
  Order,
  PartnerPayout,
  PartnerReferral,
  Patient,
  Profile,
  TreatmentPlan,
} from "@/lib/db";
import type { AssignedFormTask } from "@/lib/forms/types";
import type { AdminWorkspace } from "@/lib/menus/types";

export type UserWorkspaceSnapshot = {
  profile: Profile;
  sessionUser: SessionUser;
  portal: "admin" | "patient" | "partner" | null;
  tasks: AssignedFormTask[];
  workspace: AdminWorkspace | null;
  patientNav: { label: string; href: string }[];
  partnerNav: { label: string; href: string }[];
  patient: Patient | null;
  treatmentPlans: TreatmentPlan[];
  orders: Order[];
  documents: Document[];
  threads: MessageThread[];
  referrals: PartnerReferral[];
  payouts: PartnerPayout[];
};

const PARTNER_NAV = [
  { label: "Dashboard", href: "/partner" },
  { label: "Profile Tasks", href: "/partner/tasks" },
  { label: "Referrals", href: "/partner/referrals" },
  { label: "Refer Client", href: "/partner/refer" },
  { label: "Payouts", href: "/partner/payouts" },
  { label: "Profile", href: "/partner/profile" },
];

export async function loadUserWorkspaceSnapshot(userId: string): Promise<UserWorkspaceSnapshot | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", userId).single();
  if (!profile) return null;

  const role = profile.role as UserRole;
  const sessionUser: SessionUser = {
    id: profile.id,
    email: profile.email,
    role,
    firstName: profile.first_name,
    lastName: profile.last_name,
  };

  const portal = getPortalForRole(role);
  const tasks = await getAssignedFormsForUser(admin, userId, role);

  let workspace: AdminWorkspace | null = null;
  if (portal === "admin") {
    workspace = await resolveAdminWorkspace(admin, sessionUser).catch(() => null);
  }

  let patient: Patient | null = null;
  let treatmentPlans: TreatmentPlan[] = [];
  let orders: Order[] = [];
  let documents: Document[] = [];
  let threads: MessageThread[] = [];
  let referrals: PartnerReferral[] = [];
  let payouts: PartnerPayout[] = [];

  if (portal === "patient") {
    const { data: patientRow } = await admin
      .from("patients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    patient = (patientRow as Patient | null) ?? null;

    if (patient) {
      const [plansRes, ordersRes, docsRes, threadsRes] = await Promise.all([
        admin.from("treatment_plans").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
        admin.from("orders").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(20),
        admin.from("documents").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(20),
        admin.from("message_threads").select("*").eq("patient_id", patient.id).order("updated_at", { ascending: false }).limit(20),
      ]);
      treatmentPlans = (plansRes.data as TreatmentPlan[] | null) ?? [];
      orders = (ordersRes.data as Order[] | null) ?? [];
      documents = (docsRes.data as Document[] | null) ?? [];
      threads = (threadsRes.data as MessageThread[] | null) ?? [];
    }
  }

  if (portal === "partner") {
    const { data: partnerUser } = await admin
      .from("partner_users")
      .select("partner_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (partnerUser?.partner_id) {
      const [refRes, payRes] = await Promise.all([
        admin.from("partner_referrals").select("*").eq("partner_id", partnerUser.partner_id).order("created_at", { ascending: false }).limit(20),
        admin.from("partner_payouts").select("*").eq("partner_id", partnerUser.partner_id).order("created_at", { ascending: false }).limit(20),
      ]);
      referrals = (refRes.data as PartnerReferral[] | null) ?? [];
      payouts = (payRes.data as PartnerPayout[] | null) ?? [];
    }
  }

  return {
    profile: profile as Profile,
    sessionUser,
    portal,
    tasks,
    workspace,
    patientNav: PATIENT_NAV.map((n) => ({ label: n.label, href: n.href })),
    partnerNav: PARTNER_NAV,
    patient,
    treatmentPlans,
    orders,
    documents,
    threads,
    referrals,
    payouts,
  };
}

export function displayName(profile: Pick<Profile, "first_name" | "last_name" | "email">) {
  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  return name || profile.email;
}

export { getRoleDisplayName };
