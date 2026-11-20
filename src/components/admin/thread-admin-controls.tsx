"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui";
import { assignThread, updateThreadStatus } from "@/app/admin/inbox/actions";

export function ThreadAdminControls({
  threadId,
  status,
  assignedStaffId,
  staffOptions,
}: {
  threadId: string;
  status: "open" | "closed";
  assignedStaffId: string | null;
  staffOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-4">
      <Select
        label="Assigned to"
        value={assignedStaffId ?? ""}
        disabled={isPending}
        onChange={(e) => {
          const value = e.target.value || null;
          startTransition(async () => {
            await assignThread(threadId, value);
            router.refresh();
          });
        }}
        className="min-w-[200px]"
      >
        <option value="">Unassigned</option>
        {staffOptions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      <Select
        label="Status"
        value={status}
        disabled={isPending}
        onChange={(e) => {
          startTransition(async () => {
            await updateThreadStatus(threadId, e.target.value as "open" | "closed");
            router.refresh();
          });
        }}
        className="min-w-[140px]"
      >
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </Select>
    </div>
  );
}
