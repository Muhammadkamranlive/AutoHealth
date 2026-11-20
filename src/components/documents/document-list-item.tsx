"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { getDocumentDownloadUrl } from "@/app/documents/actions";
import { documentTypeLabel } from "@/lib/documents/constants";

export function DocumentListItem({
  id,
  fileName,
  type,
  createdAt,
}: {
  id: string;
  fileName: string;
  type: string;
  createdAt: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      try {
        const url = await getDocumentDownloadUrl(id);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        alert("Could not download file. Try again.");
      }
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-800 dark:text-slate-100">{fileName}</p>
        <p className="text-xs text-slate-500">
          {documentTypeLabel(type)} · {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={handleDownload} disabled={isPending}>
        {isPending ? "Opening…" : "Download"}
      </Button>
    </li>
  );
}
