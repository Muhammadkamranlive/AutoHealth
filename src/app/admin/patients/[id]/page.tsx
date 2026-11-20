import { notFound, redirect } from "next/navigation";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import type { Document, Invoice, Message, MessageThread, Order, Subscription, TreatmentPlan } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { PatientDetailTabs } from "@/components/admin/patient-detail-tabs";
import { getPatientAuditTrail } from "@/lib/admin/audit-trail";

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "patients:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single();
  if (!patient) notFound();

  const [
    { data: profile },
    { data: treatmentPlans },
    { data: orders },
    { data: documents },
    { data: subscriptions },
    { data: invoices },
    { data: threads },
  ] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, email, phone").eq("id", patient.user_id).single(),
    supabase.from("treatment_plans").select("*").eq("patient_id", id).order("start_date", { ascending: false }),
    supabase.from("orders").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
    supabase.from("documents").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
    supabase.from("message_threads").select("*").eq("patient_id", id).order("updated_at", { ascending: false }),
  ]);

  const threadIds = (threads as MessageThread[] | null)?.map((t) => t.id) ?? [];
  let recentMessages: (Message & { thread?: MessageThread })[] = [];

  if (threadIds.length) {
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false })
      .limit(10);

    const threadMap = new Map((threads as MessageThread[]).map((t) => [t.id, t]));
    recentMessages = ((messages as Message[]) ?? []).map((m) => ({
      ...m,
      thread: threadMap.get(m.thread_id),
    }));
  }

  let physicianName: string | null = null;
  if (patient.assigned_physician_id) {
    const { data: physician } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", patient.assigned_physician_id)
      .single();
    if (physician) {
      physicianName = `${physician.first_name ?? ""} ${physician.last_name ?? ""}`.trim();
    }
  }

  const orderList = (orders as Order[]) ?? [];
  const planList = (treatmentPlans as TreatmentPlan[]) ?? [];
  const docList = (documents as Document[]) ?? [];

  const auditEntries = await getPatientAuditTrail(supabase, id, {
    orderIds: orderList.map((o) => o.id),
    planIds: planList.map((p) => p.id),
    documentIds: docList.map((d) => d.id),
    threadIds,
  });

  const actorIds = [...new Set(auditEntries.map((e) => e.actor_id))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", actorIds)
    : { data: [] };

  const actorNames: Record<string, string> = {};
  for (const a of actors ?? []) {
    actorNames[a.id] = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || a.email;
  }

  const { data: billingPlans } = await supabase
    .from("billing_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const billingPlanNames: Record<string, string> = {};
  for (const p of billingPlans ?? []) {
    billingPlanNames[p.id] = p.name;
  }

  return (
    <PatientDetailTabs
      patient={patient}
      profile={profile}
      physicianName={physicianName}
      treatmentPlans={planList}
      orders={orderList}
      threads={(threads as MessageThread[]) ?? []}
      recentMessages={recentMessages}
      documents={docList}
      subscriptions={(subscriptions as Subscription[]) ?? []}
      invoices={(invoices as Invoice[]) ?? []}
      auditEntries={auditEntries}
      actorNames={actorNames}
      billingPlans={billingPlans ?? []}
      billingPlanNames={billingPlanNames}
    />
  );
}
