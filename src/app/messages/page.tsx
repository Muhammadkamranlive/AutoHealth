import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, EmptyState } from "@/components/ui";
import { NewThreadForm } from "@/components/messaging/new-thread-form";
import { PatientShell } from "@/components/patient-shell";
import { PatientPageHeader } from "@/components/patient/page-header";
import { getSessionUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
  if (!patient) redirect("/dashboard");

  const { data: threads } = await supabase
    .from("message_threads")
    .select("*")
    .eq("patient_id", patient.id)
    .order("updated_at", { ascending: false });

  const threadIds = threads?.map((t) => t.id) ?? [];
  const { data: latestMessages } = threadIds.length
    ? await supabase
        .from("messages")
        .select("thread_id, body, created_at, sender_id, read_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const previewByThread = new Map<string, { body: string; unread: boolean }>();
  for (const msg of latestMessages ?? []) {
    if (!previewByThread.has(msg.thread_id)) {
      previewByThread.set(msg.thread_id, {
        body: msg.body,
        unread: msg.sender_id !== user.id && !msg.read_at,
      });
    }
  }

  return (
    <PatientShell user={user}>
      <div className="space-y-6">
        <PatientPageHeader title="Messages" description="Conversations with your care team" />

        <Card title="New conversation">
          <NewThreadForm />
        </Card>

        {!threads?.length ? (
          <EmptyState title="No conversations yet" description="Start a conversation above." />
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => {
              const preview = previewByThread.get(thread.id);
              return (
                <Link
                  key={thread.id}
                  href={`/messages/${thread.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-medical-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {thread.subject ?? "General inquiry"}
                      </p>
                      {preview && (
                        <p className="mt-1 truncate text-sm text-slate-500">{preview.body}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={thread.status === "open" ? "success" : "default"}>
                        {thread.status}
                      </Badge>
                      {preview?.unread && <Badge variant="info">Unread</Badge>}
                      <span className="text-xs text-slate-400">
                        {new Date(thread.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PatientShell>
  );
}
