import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, requirePermission, getEffectivePermissions } from "@/lib/auth/server";
import type { Patient, Profile, TreatmentPlan } from "@/lib/db";
import { Badge, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import {
  PatientFiltersBar,
  PatientPagination,
  type PatientListFilters,
} from "@/components/admin/patient-filters";

const PAGE_SIZE = 25;

interface PatientsPageProps {
  searchParams: Promise<PatientListFilters>;
}

function PageHeader({ showRegister }: { showRegister?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-medical-950 dark:text-white">Patients</h1>
        <p className="text-slate-600 dark:text-slate-400">Search, filter, and manage patient records</p>
      </div>
      {showRegister && (
        <Link
          href="/admin/patients/register"
          className="inline-flex min-h-11 items-center rounded-xl bg-medical-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-medical-700"
        >
          + Register patient
        </Link>
      )}
    </div>
  );
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "patients:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const permissions = await getEffectivePermissions(supabase, user);
  const canRegister = permissions.includes("patients:create");

  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: physicians }, { data: allActivePlans }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("role", "physician")
      .order("last_name"),
    supabase.from("treatment_plans").select("medication").eq("status", "active"),
  ]);

  const physicianOptions =
    physicians?.map((p) => ({
      id: p.id,
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id.slice(0, 8),
    })) ?? [];

  const planOptions = [...new Set((allActivePlans ?? []).map((p) => p.medication))].sort();

  let scopedPatientIds: string[] | null = null;

  function intersect(ids: string[] | null, next: string[]): string[] {
    if (!ids) return next;
    const set = new Set(next);
    return ids.filter((id) => set.has(id));
  }

  if (params.q) {
    const { data: matchingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .or(`first_name.ilike.%${params.q}%,last_name.ilike.%${params.q}%,email.ilike.%${params.q}%`);
    const userIds = matchingProfiles?.map((p) => p.id) ?? [];
    if (!userIds.length) {
      return (
        <div className="space-y-6">
          <PageHeader showRegister={canRegister} />
          <PatientFiltersBar defaultFilters={params} physicians={physicianOptions} planOptions={planOptions} />
          <EmptyState title="No patients found" description="Try adjusting your search or filters." />
        </div>
      );
    }
    const { data: matchedPatients } = await supabase.from("patients").select("id").in("user_id", userIds);
    scopedPatientIds = matchedPatients?.map((p) => p.id) ?? [];
    if (!scopedPatientIds.length) {
      return (
        <div className="space-y-6">
          <PageHeader showRegister={canRegister} />
          <PatientFiltersBar defaultFilters={params} physicians={physicianOptions} planOptions={planOptions} />
          <EmptyState title="No patients found" description="Try adjusting your search or filters." />
        </div>
      );
    }
  }

  if (params.physician) {
    const { data: rows } = await supabase
      .from("patients")
      .select("id")
      .eq("assigned_physician_id", params.physician);
    scopedPatientIds = intersect(scopedPatientIds, rows?.map((r) => r.id) ?? []);
    if (scopedPatientIds.length === 0) {
      return (
        <div className="space-y-6">
          <PageHeader showRegister={canRegister} />
          <PatientFiltersBar defaultFilters={params} physicians={physicianOptions} planOptions={planOptions} />
          <EmptyState title="No patients match filters" description="Try a different physician or clear filters." />
        </div>
      );
    }
  }

  if (params.plan) {
    const { data: rows } = await supabase
      .from("treatment_plans")
      .select("patient_id")
      .eq("status", "active")
      .ilike("medication", `%${params.plan}%`);
    scopedPatientIds = intersect(scopedPatientIds, rows?.map((r) => r.patient_id) ?? []);
    if (scopedPatientIds.length === 0) {
      return (
        <div className="space-y-6">
          <PageHeader showRegister={canRegister} />
          <PatientFiltersBar defaultFilters={params} physicians={physicianOptions} planOptions={planOptions} />
          <EmptyState title="No patients match filters" description="No active plans match this medication." />
        </div>
      );
    }
  }

  if (params.status === "active_plan") {
    const { data: rows } = await supabase
      .from("treatment_plans")
      .select("patient_id")
      .eq("status", "active");
    scopedPatientIds = intersect(scopedPatientIds, rows?.map((r) => r.patient_id) ?? []);
  } else if (params.status === "no_plan") {
    const { data: activeRows } = await supabase
      .from("treatment_plans")
      .select("patient_id")
      .eq("status", "active");
    const withPlan = new Set(activeRows?.map((r) => r.patient_id) ?? []);
    let query = supabase.from("patients").select("id");
    if (scopedPatientIds) query = query.in("id", scopedPatientIds);
    const { data: allPatients } = await query;
    scopedPatientIds = (allPatients ?? []).map((p) => p.id).filter((id) => !withPlan.has(id));
  } else if (params.status === "pending_review") {
    const { data: rows } = await supabase
      .from("orders")
      .select("patient_id")
      .eq("status", "pending_review");
    scopedPatientIds = intersect(scopedPatientIds, [...new Set(rows?.map((r) => r.patient_id) ?? [])]);
  }

  if (scopedPatientIds && scopedPatientIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader showRegister={canRegister} />
        <PatientFiltersBar defaultFilters={params} physicians={physicianOptions} planOptions={planOptions} />
        <EmptyState title="No patients match filters" description="Clear filters to see all patients." />
      </div>
    );
  }

  const sort = params.sort ?? "recent";
  let patientQuery = supabase
    .from("patients")
    .select("id, user_id, assigned_physician_id, created_at, updated_at", { count: "exact" });

  if (scopedPatientIds) {
    patientQuery = patientQuery.in("id", scopedPatientIds);
  }

  if (sort === "enrolled") {
    patientQuery = patientQuery.order("created_at", { ascending: false });
  } else if (sort === "name") {
    patientQuery = patientQuery.order("created_at", { ascending: true });
  } else {
    patientQuery = patientQuery.order("updated_at", { ascending: false });
  }

  const { data: patients, error, count } = await patientQuery.range(from, to);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader showRegister={canRegister} />
        <PatientFiltersBar defaultFilters={params} physicians={physicianOptions} planOptions={planOptions} />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load patients.
        </div>
      </div>
    );
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (!patients?.length) {
    return (
      <div className="space-y-6">
        <PageHeader showRegister={canRegister} />
        <PatientFiltersBar defaultFilters={params} physicians={physicianOptions} planOptions={planOptions} />
        <EmptyState title="No patients found" description="Patients will appear here once enrolled." />
      </div>
    );
  }

  const userIds = patients.map((p) => p.user_id);
  const patientIds = patients.map((p) => p.id);
  const physicianIds = [...new Set(patients.map((p) => p.assigned_physician_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: plans }, { data: physicianProfiles }, { data: lastOrders }] =
    await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds),
      supabase
        .from("treatment_plans")
        .select("patient_id, status, medication")
        .in("patient_id", patientIds)
        .eq("status", "active"),
      physicianIds.length
        ? supabase.from("profiles").select("id, first_name, last_name").in("id", physicianIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("orders")
        .select("patient_id, created_at")
        .in("patient_id", patientIds)
        .order("created_at", { ascending: false }),
    ]);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const planMap = new Map(plans?.map((p) => [p.patient_id, p]) ?? []);
  const physicianMap = new Map(
    physicianProfiles?.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()]) ?? []
  );
  const lastActivityMap = new Map<string, string>();
  for (const order of lastOrders ?? []) {
    if (!lastActivityMap.has(order.patient_id)) {
      lastActivityMap.set(order.patient_id, order.created_at);
    }
  }

  let sortedPatients = [...patients];
  if (sort === "name") {
    sortedPatients.sort((a, b) => {
      const pa = profileMap.get(a.user_id);
      const pb = profileMap.get(b.user_id);
      const na = `${pa?.last_name ?? ""}${pa?.first_name ?? ""}`.toLowerCase();
      const nb = `${pb?.last_name ?? ""}${pb?.first_name ?? ""}`.toLowerCase();
      return na.localeCompare(nb);
    });
  } else if (sort === "activity") {
    sortedPatients.sort((a, b) => {
      const ta = lastActivityMap.get(a.id) ?? a.updated_at;
      const tb = lastActivityMap.get(b.id) ?? b.updated_at;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader showRegister={canRegister} />
      <PatientFiltersBar defaultFilters={params} physicians={physicianOptions} planOptions={planOptions} />
      <PatientPagination page={page} totalPages={totalPages} totalCount={totalCount} filters={params} />

      <div className="overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Physician</TableHead>
              <TableHead>Active plan</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPatients.map((patient: Pick<Patient, "id" | "user_id" | "assigned_physician_id" | "created_at" | "updated_at">) => {
              const profile = profileMap.get(patient.user_id) as Pick<Profile, "first_name" | "last_name" | "email"> | undefined;
              const activePlan = planMap.get(patient.id) as Pick<TreatmentPlan, "medication"> | undefined;
              const lastActivity = lastActivityMap.get(patient.id);

              return (
                <TableRow key={patient.id}>
                  <TableCell>
                    <span className="font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </span>
                  </TableCell>
                  <TableCell>{profile?.email}</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {patient.assigned_physician_id
                      ? physicianMap.get(patient.assigned_physician_id) ?? "—"
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {activePlan ? (
                      <Badge variant="success">{activePlan.medication}</Badge>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {lastActivity ? new Date(lastActivity).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>{new Date(patient.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/patients/${patient.id}`}
                      className="text-sm font-medium text-medical-600 hover:text-medical-700"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PatientPagination page={page} totalPages={totalPages} totalCount={totalCount} filters={params} />
    </div>
  );
}
