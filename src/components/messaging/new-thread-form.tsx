"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Input, LoadingOverlay, Textarea } from "@/components/ui";
import { createThread } from "@/app/messages/actions";

export function NewThreadForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const threadId = await createThread(subject, message);
        router.push(`/messages/${threadId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create conversation");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LoadingOverlay active={isPending} message="saving" />
      <Input
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="What is this about?"
        disabled={isPending}
      />
      <Textarea
        label="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your question or concern…"
        disabled={isPending}
        rows={4}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isPending || !message.trim()}>
        Start conversation
      </Button>
    </form>
  );
}
