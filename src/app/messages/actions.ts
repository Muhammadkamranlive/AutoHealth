"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/server";
import {
  loadThreadDetail,
  markThreadMessagesRead,
  sendThreadMessage,
} from "@/lib/messaging/thread-utils";
import { createClient } from "@/lib/supabase/server";

export async function createThread(subject: string, initialMessage: string) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user || user.role !== "patient") throw new Error("Unauthorized");

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) throw new Error("Patient record not found");

  const trimmedSubject = subject.trim() || "General inquiry";
  const trimmedBody = initialMessage.trim();
  if (!trimmedBody) throw new Error("Message cannot be empty");

  const { data: thread, error: threadError } = await supabase
    .from("message_threads")
    .insert({
      patient_id: patient.id,
      subject: trimmedSubject,
      status: "open",
      channel: "in_app",
      assigned_staff_id: null,
    })
    .select("id")
    .single();

  if (threadError || !thread) throw new Error(threadError?.message ?? "Failed to create thread");

  await sendThreadMessage(supabase, {
    threadId: thread.id,
    senderId: user.id,
    senderRole: user.role,
    body: trimmedBody,
  });

  revalidatePath("/messages");
  return thread.id;
}

export async function sendPatientMessage(threadId: string, body: string) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user || user.role !== "patient") throw new Error("Unauthorized");

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) throw new Error("Patient record not found");

  const { data: thread } = await supabase
    .from("message_threads")
    .select("id, patient_id, status")
    .eq("id", threadId)
    .single();

  if (!thread || thread.patient_id !== patient.id) throw new Error("Thread not found");
  if (thread.status === "closed") throw new Error("This conversation is closed");

  await sendThreadMessage(supabase, {
    threadId,
    senderId: user.id,
    senderRole: user.role,
    body,
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${threadId}`);
}

export async function getPatientThread(threadId: string) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user || user.role !== "patient") return null;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) return null;

  const detail = await loadThreadDetail(supabase, threadId, user.id);
  if (!detail || detail.patient_id !== patient.id) return null;

  await markThreadMessagesRead(supabase, threadId, user.id);
  return detail;
}
