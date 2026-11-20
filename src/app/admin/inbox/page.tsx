import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { MessageThread, Profile } from "@/lib/db";
import { Badge, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { InboxFilters } from "@/components/admin/inbox-filters";
import { getFilteredThreads, type InboxFilters as InboxFilterParams } from "@/app/admin/inbox/actions";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InboxPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "inbox:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const params = await searchParams;
  const filters: InboxFilterParams = {
    status: (readParam(params.status) as InboxFilterParams["status"]) ?? "all",
    assigned: (readParam(params.assigned) as InboxFilterParams["assigned"]) ?? "all",
    unread: readParam(params.unread) === "1",
  };

  const threads = await getFilteredThreads(filters);

  const header = (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-medical-950 dark:text-white">Unified Inbox</h1>
      <p className="text-slate-600 dark:text-slate-400">Patient conversations — in-app and email</p>
    </div>
  );

  if (!threads.length) {
    return (
      <div className="space-y-6">
        {header}
        <Suspense>
          <InboxFilters />
        </Suspense>
        <EmptyState title="No message threads" description="Adjust filters or wait for patient messages." />
      </div>
    );
  }

  const patientIds = [...new Set(threads.map((t) => t.patient_id))];
  const staffIds = threads.map((t) => t.assigned_staff_id).filter(Boolean) as string[];

  const [{ data: patients }, { data: staffProfiles }] = await Promise.all([
    supabase.from("patients").select("id, user_id").in("id", patientIds),
    staffIds.length
      ? supabase.from("profiles").select("id, first_name, last_name").in("id", staffIds)
      : Promise.resolve({ data: [] as Pick<Profile, "id" | "first_name" | "last_name">[] }),
  ]);

  const userIds = patients?.map((p) => p.user_id) ?? [];
  const { data: patientProfiles } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "first_name" | "last_name" | "email">[] };

  const patientUserMap = new Map(patients?.map((p) => [p.id, p.user_id]) ?? []);
  const profileMap = new Map(patientProfiles?.map((p) => [p.id, p]) ?? []);
  const staffMap = new Map(staffProfiles?.map((p) => [p.id, p]) ?? []);

  return (
    <div className="space-y-6">
      {header}
      <Suspense>
        <InboxFilters />
      </Suspense>

      <div className="overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Unread</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(threads as (MessageThread & { unreadCount: number })[]).map((thread) => {
              const userId = patientUserMap.get(thread.patient_id);
              const patientProfile = userId ? profileMap.get(userId) : undefined;
              const staff = thread.assigned_staff_id ? staffMap.get(thread.assigned_staff_id) : undefined;

              return (
                <TableRow key={thread.id}>
                  <TableCell>
                    <Link href={`/admin/inbox/${thread.id}`} className="font-medium text-medical-700 hover:underline dark:text-medical-300">
                      {patientProfile?.first_name} {patientProfile?.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/inbox/${thread.id}`} className="hover:underline">
                      {thread.subject ?? "General inquiry"}
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="info">{thread.channel}</Badge></TableCell>
                  <TableCell><Badge variant={thread.status === "open" ? "success" : "default"}>{thread.status}</Badge></TableCell>
                  <TableCell>{staff ? `${staff.first_name} ${staff.last_name}` : "Unassigned"}</TableCell>
                  <TableCell>{thread.unreadCount > 0 ? <Badge variant="warning">{thread.unreadCount}</Badge> : "—"}</TableCell>
                  <TableCell>{new Date(thread.updated_at).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
