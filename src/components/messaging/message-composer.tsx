"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, LoadingOverlay, Textarea } from "@/components/ui";
import { sendPatientMessage } from "@/app/messages/actions";

export function MessageComposer({
  threadId,
  disabled,
  placeholder = "Type your message…",
}: {
  threadId: string;
  disabled?: boolean;
  placeholder?: string;
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
        await sendPatientMessage(threadId, body);
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
      <LoadingOverlay active={isPending} message="sending" />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isPending}
        rows={3}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || isPending || !body.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
}
