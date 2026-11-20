"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, LoadingOverlay, Textarea } from "@/components/ui";
import { sendStaffReply } from "@/app/admin/inbox/actions";

export function StaffReplyComposer({
  threadId,
  disabled,
  sendEmail = true,
}: {
  threadId: string;
  disabled?: boolean;
  sendEmail?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        await sendStaffReply(threadId, body, sendEmail);
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reply");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
      <LoadingOverlay active={isPending} message="sending" />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Reply to patient…"
        disabled={disabled || isPending}
        rows={4}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {sendEmail ? "Reply sends in-app and by email when configured." : "In-app only."}
        </p>
        <Button type="submit" disabled={disabled || isPending || !body.trim()}>
          Send reply
        </Button>
      </div>
    </form>
  );
}
