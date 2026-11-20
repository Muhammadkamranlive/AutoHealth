import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogEntry } from "@/lib/db";

/** Fetch audit entries related to a patient record and their clinical artifacts. */
export async function getPatientAuditTrail(
  supabase: SupabaseClient,
  patientId: string,
  relatedIds: {
    orderIds: string[];
    planIds: string[];
    documentIds: string[];
    threadIds: string[];
  }
): Promise<AuditLogEntry[]> {
  const queries = [
    supabase
      .from("audit_log")
      .select("*")
      .eq("target_table", "patients")
      .eq("target_id", patientId),
  ];

  if (relatedIds.orderIds.length) {
    queries.push(
      supabase
        .from("audit_log")
        .select("*")
        .eq("target_table", "orders")
        .in("target_id", relatedIds.orderIds)
    );
  }
  if (relatedIds.planIds.length) {
    queries.push(
      supabase
        .from("audit_log")
        .select("*")
        .eq("target_table", "treatment_plans")
        .in("target_id", relatedIds.planIds)
    );
  }
  if (relatedIds.documentIds.length) {
    queries.push(
      supabase
        .from("audit_log")
        .select("*")
        .eq("target_table", "documents")
        .in("target_id", relatedIds.documentIds)
    );
  }

  const results = await Promise.all(queries);
  const entries = results.flatMap((r) => (r.data ?? []) as AuditLogEntry[]);

  const seen = new Set<string>();
  return entries
    .filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 100);
}

export function formatAuditAction(action: string): string {
  return action.replace(/\./g, " · ").replace(/_/g, " ");
}
