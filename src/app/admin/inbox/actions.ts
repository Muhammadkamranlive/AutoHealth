"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/server";
import { isInternalRole } from "@/lib/auth/roles";
import {
  loadThreadDetail,
  markThreadMessagesRead,
  sendThreadMessage,
} from "@/lib/messaging/thread-utils";
import { createClient } from "@/lib/supabase/server";

export async function assignThread(threadId: string, staffId: string | null) {
  const supabase = await createClient();
  await requirePermission(supabase, "inbox:update");

  const { error } = await supabase
    .from("message_threads")
    .update({ assigned_staff_id: staffId })
    .eq("id", threadId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${threadId}`);
}

export async function updateThreadStatus(threadId: string, status: "open" | "closed") {
  const supabase = await createClient();
  await requirePermission(supabase, "inbox:update");

  const { error } = await supabase
    .from("message_threads")
    .update({ status })
    .eq("id", threadId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${threadId}`);
}

export async function sendStaffReply(threadId: string, body: string, sendEmail = true) {
  const supabase = await createClient();
  const user = await requirePermission(supabase, "messages:update");

  if (!isInternalRole(user.role)) throw new Error("Unauthorized");

  const detail = await loadThreadDetail(supabase, threadId, user.id);
  if (!detail) throw new Error("Thread not found");

  await sendThreadMessage(supabase, {
    threadId,
    senderId: user.id,
    senderRole: user.role,
    body,
    notifyEmail: sendEmail,
    patientEmail: detail.patientEmail,
    threadSubject: detail.subject,
  });

  if (!detail.assigned_staff_id) {
    await supabase
      .from("message_threads")
      .update({ assigned_staff_id: user.id })
      .eq("id", threadId);
  }

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${threadId}`);
  revalidatePath("/messages");
  revalidatePath(`/messages/${threadId}`);
}

export async function getStaffThread(threadId: string) {
  const supabase = await createClient();
  const user = await requirePermission(supabase, "inbox:read");

  const detail = await loadThreadDetail(supabase, threadId, user.id);
  if (!detail) return null;

  await markThreadMessagesRead(supabase, threadId, user.id);
  return detail;
}

export type InboxFilters = {
  status?: "open" | "closed" | "all";
  assigned?: "me" | "unassigned" | "all";
  unread?: boolean;
};

export async function getFilteredThreads(filters: InboxFilters) {
  const supabase = await createClient();
  const user = await requirePermission(supabase, "inbox:read");

  let query = supabase
    .from("message_threads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.assigned === "me") {
    query = query.eq("assigned_staff_id", user.id);
  } else if (filters.assigned === "unassigned") {
    query = query.is("assigned_staff_id", null);
  }

  const { data: threads } = await query;
  if (!threads?.length) return [];

  const threadIds = threads.map((t) => t.id);
  const { data: messages } = await supabase
    .from("messages")
    .select("thread_id, sender_id, read_at")
    .in("thread_id", threadIds);

  const unreadByThread = new Map<string, number>();
  for (const msg of messages ?? []) {
    if (msg.sender_id !== user.id && !msg.read_at) {
      unreadByThread.set(msg.thread_id, (unreadByThread.get(msg.thread_id) ?? 0) + 1);
    }
  }

  let result = threads.map((t) => ({
    ...t,
    unreadCount: unreadByThread.get(t.id) ?? 0,
  }));

  if (filters.unread) {
    result = result.filter((t) => t.unreadCount > 0);
  }

  return result;
}
