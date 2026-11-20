"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card, Input, LoadingOverlay } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { PartnerShell } from "@/components/partner-shell";
import type { SessionUser } from "@/lib/auth";

export function ReferClientForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const supabase = createClient();
      const { data: partnerUser } = await supabase
        .from("partner_users")
        .select("partner_id")
        .eq("user_id", user.id)
        .single();

      if (!partnerUser) {
        setError("Partner account not linked. Contact support.");
        return;
      }

      const { error: insertError } = await supabase.from("partner_referrals").insert({
        partner_id: partnerUser.partner_id,
        referred_name: form.name,
        referred_email: form.email,
        referred_phone: form.phone || null,
        patient_id: null,
        enrolled_at: null,
        status: "referred",
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push("/partner/referrals");
      router.refresh();
    });
  }

  return (
    <PartnerShell user={user}>
      <LoadingOverlay active={isPending} message="saving" />
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Refer a Client</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isPending}>Submit Referral</Button>
          </form>
        </Card>
      </div>
    </PartnerShell>
  );
}
