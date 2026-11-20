import type { Message, MessageThread, Profile, UserRole } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ThreadMessage = Message & {
  senderName: string;
  isOwn: boolean;
};

export type ThreadDetail = MessageThread & {
  messages: ThreadMessage[];
  patientName: string;
  patientEmail: string;
};

export function formatSenderName(profile: Pick<Profile, "first_name" | "last_name"> | null): string {
  if (!profile) return "Unknown";
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return name || "Unknown";
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function loadThreadDetail(
  supabase: Supabase,
  threadId: string,
  viewerId: string
): Promise<ThreadDetail | null> {
  const { data: thread } = await supabase
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .single();

  if (!thread) return null;

  const [{ data: messages }, { data: patient }] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true }),
    supabase.from("patients").select("user_id").eq("id", thread.patient_id).single(),
  ]);

  const senderIds = [...new Set(messages?.map((m) => m.sender_id) ?? [])];
  const profileIds = patient?.user_id
    ? [...new Set([...senderIds, patient.user_id])]
    : senderIds;

  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", profileIds)
    : { data: [] as Pick<Profile, "id" | "first_name" | "last_name" | "email">[] };

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const patientProfile = patient?.user_id ? profileMap.get(patient.user_id) : undefined;

  const enriched: ThreadMessage[] = (messages ?? []).map((msg) => {
    const profile = profileMap.get(msg.sender_id);
    return {
      ...msg,
      senderName: formatSenderName(profile ?? null),
      isOwn: msg.sender_id === viewerId,
    };
  });

  return {
    ...thread,
    messages: enriched,
    patientName: formatSenderName(patientProfile ?? null),
    patientEmail: patientProfile?.email ?? "",
  };
}

export async function sendThreadMessage(
  supabase: Supabase,
  opts: {
    threadId: string;
    senderId: string;
    senderRole: UserRole;
    body: string;
    notifyEmail?: boolean;
    patientEmail?: string;
    threadSubject?: string | null;
  }
) {
  const trimmed = opts.body.trim();
  if (!trimmed) throw new Error("Message cannot be empty");

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      thread_id: opts.threadId,
      sender_id: opts.senderId,
      sender_role: opts.senderRole,
      body: trimmed,
      attachments: [],
      read_at: null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (opts.notifyEmail && opts.patientEmail) {
    await sendEmail({
      to: opts.patientEmail,
      subject: opts.threadSubject ? `Re: ${opts.threadSubject}` : "Message from your care team",
      text: trimmed,
      replyTo: process.env.EMAIL_REPLY_TO,
    });
  }

  return message;
}

export async function markThreadMessagesRead(
  supabase: Supabase,
  threadId: string,
  readerId: string
) {
  const now = new Date().toISOString();
  await supabase
    .from("messages")
    .update({ read_at: now })
    .eq("thread_id", threadId)
    .neq("sender_id", readerId)
    .is("read_at", null);
}
