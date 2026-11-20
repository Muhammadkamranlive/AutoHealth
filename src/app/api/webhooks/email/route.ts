import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/db";
import { sendThreadMessage } from "@/lib/messaging/thread-utils";

type InboundEmailPayload = {
  from: string;
  subject?: string;
  text?: string;
  body?: string;
  thread_id?: string;
};

export async function POST(request: Request) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: InboundEmailPayload;
  try {
    payload = (await request.json()) as InboundEmailPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromEmail = payload.from?.trim().toLowerCase();
  const body = (payload.text ?? payload.body ?? "").trim();

  if (!fromEmail || !body) {
    return NextResponse.json({ error: "from and message body are required" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", fromEmail)
    .eq("role", "patient")
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Patient not found for sender email" }, { status: 404 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", profile.id)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
  }

  let threadId = payload.thread_id;

  if (threadId) {
    const { data: thread } = await supabase
      .from("message_threads")
      .select("id, patient_id")
      .eq("id", threadId)
      .single();

    if (!thread || thread.patient_id !== patient.id) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
  } else {
    const subject = payload.subject?.trim() || "Email inquiry";
    const { data: existing } = await supabase
      .from("message_threads")
      .select("id")
      .eq("patient_id", patient.id)
      .eq("status", "open")
      .ilike("subject", subject)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      threadId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("message_threads")
        .insert({
          patient_id: patient.id,
          subject,
          status: "open",
          channel: "email",
          assigned_staff_id: null,
        })
        .select("id")
        .single();

      if (error || !created) {
        return NextResponse.json({ error: error?.message ?? "Failed to create thread" }, { status: 500 });
      }
      threadId = created.id;
    }
  }

  await sendThreadMessage(supabase, {
    threadId: threadId!,
    senderId: profile.id,
    senderRole: "patient",
    body,
  });

  return NextResponse.json({ ok: true, thread_id: threadId });
}
