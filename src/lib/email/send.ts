import { Resend } from "resend";
import { brand } from "@/lib/brand";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail(payload: OutboundEmail): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping outbound email");
    return { ok: false, error: "Email not configured" };
  }

  const from = process.env.EMAIL_FROM ?? brand.emailFromFallback;

  const { error } = await resend.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    replyTo: payload.replyTo,
  });

  if (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
