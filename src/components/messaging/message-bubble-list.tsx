import type { ThreadMessage } from "@/lib/messaging/thread-utils";
import { formatMessageTime } from "@/lib/messaging/thread-utils";
import { cn } from "@/components/ui";

export function MessageBubbleList({ messages }: { messages: ThreadMessage[] }) {
  if (!messages.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">No messages yet. Start the conversation below.</p>
    );
  }

  return (
    <ul className="flex max-h-[480px] flex-col gap-3 overflow-y-auto px-1 py-2">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className={cn("flex flex-col", msg.isOwn ? "items-end" : "items-start")}
        >
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
              msg.isOwn
                ? "rounded-br-md bg-medical-600 text-white"
                : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            )}
          >
            {!msg.isOwn && (
              <p className="mb-1 text-xs font-medium opacity-70">{msg.senderName}</p>
            )}
            <p className="whitespace-pre-wrap">{msg.body}</p>
          </div>
          <span className="mt-1 flex items-center gap-2 px-1 text-xs text-slate-400">
            {formatMessageTime(msg.created_at)}
            {msg.isOwn && msg.read_at && <span>· Read</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
