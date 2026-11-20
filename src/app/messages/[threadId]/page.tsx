import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { MessageBubbleList } from "@/components/messaging/message-bubble-list";
import { MessageComposer } from "@/components/messaging/message-composer";
import { PatientShell } from "@/components/patient-shell";
import { getPatientThread } from "@/app/messages/actions";
import { getSessionUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const thread = await getPatientThread(threadId);
  if (!thread) notFound();

  return (
    <PatientShell user={user}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/messages" className="text-sm text-medical-600 hover:underline">
              ← All messages
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {thread.subject ?? "General inquiry"}
            </h1>
          </div>
          <Badge variant={thread.status === "open" ? "success" : "default"}>{thread.status}</Badge>
        </div>

        <Card>
          <MessageBubbleList messages={thread.messages} />
          {thread.status === "open" ? (
            <MessageComposer threadId={thread.id} />
          ) : (
            <p className="border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-700">
              This conversation is closed. Start a new thread if you need further help.
            </p>
          )}
        </Card>
      </div>
    </PatientShell>
  );
}
