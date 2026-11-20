import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { MessageBubbleList } from "@/components/messaging/message-bubble-list";
import { StaffReplyComposer } from "@/components/messaging/staff-reply-composer";
import { ThreadAdminControls } from "@/components/admin/thread-admin-controls";
import { getStaffThread } from "@/app/admin/inbox/actions";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { isEmailConfigured } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";

export default async function AdminThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "inbox:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const thread = await getStaffThread(threadId);
  if (!thread) notFound();

  const { data: staffProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .in("role", ["physician", "care_team", "admin"]);

  const staffOptions =
    staffProfiles?.map((p) => ({
      id: p.id,
      name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.id,
    })) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/inbox" className="text-sm text-medical-600 hover:underline">
          ← Back to inbox
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {thread.subject ?? "General inquiry"}
            </h1>
            <p className="text-sm text-slate-500">
              {thread.patientName} · {thread.patientEmail}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="info">{thread.channel}</Badge>
            <Badge variant={thread.status === "open" ? "success" : "default"}>{thread.status}</Badge>
          </div>
        </div>
      </div>

      <Card title="Routing">
        <ThreadAdminControls
          threadId={thread.id}
          status={thread.status}
          assignedStaffId={thread.assigned_staff_id}
          staffOptions={staffOptions}
        />
      </Card>

      <Card title="Conversation">
        <MessageBubbleList messages={thread.messages} />
        {thread.status === "open" ? (
          <StaffReplyComposer threadId={thread.id} sendEmail={isEmailConfigured()} />
        ) : (
          <p className="border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-700">
            Reopen the thread to send a reply.
          </p>
        )}
      </Card>
    </div>
  );
}
