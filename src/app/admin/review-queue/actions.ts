"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function approveOrder(orderId: string) {
  const supabase = await createClient();
  const user = await requirePermission(supabase, "orders:approve");

  const { data: order } = await supabase
    .from("orders")
    .select("patient_id")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "approved" as const,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  await supabase.rpc("write_audit_log", {
    p_action: "order.approved",
    p_target_table: "orders",
    p_target_id: orderId,
    p_metadata: { reviewed_by: user.id },
  });

  revalidatePath("/admin/review-queue");
  revalidatePath("/admin/patients");
  if (order?.patient_id) revalidatePath(`/admin/patients/${order.patient_id}`);
}

export async function denyOrder(orderId: string, reason: string) {
  const supabase = await createClient();
  const user = await requirePermission(supabase, "orders:approve");

  if (!reason.trim()) {
    throw new Error("Denial reason is required");
  }

  const { data: order } = await supabase
    .from("orders")
    .select("patient_id")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "denied" as const,
      denial_reason: reason.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  await supabase.rpc("write_audit_log", {
    p_action: "order.denied",
    p_target_table: "orders",
    p_target_id: orderId,
    p_metadata: { reviewed_by: user.id, reason: reason.trim() },
  });

  revalidatePath("/admin/review-queue");
  revalidatePath("/admin/patients");
  if (order?.patient_id) revalidatePath(`/admin/patients/${order.patient_id}`);
}
