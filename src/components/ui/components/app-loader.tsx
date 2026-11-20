import { cn } from "../lib/utils";

export type LoaderMessage = "loading" | "saving" | "uploading";

const MESSAGES: Record<LoaderMessage, string> = {
  loading: "Please wait, loading…",
  saving: "Please wait, saving…",
  uploading: "Please wait, uploading…",
};

function resolveMessage(message: LoaderMessage | string): string {
  if (message in MESSAGES) return MESSAGES[message as LoaderMessage];
  return message;
}

export function CircularLoader({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "h-10 w-10 animate-spin rounded-full border-[3px] border-medical-100 border-t-medical-600 sm:h-12 sm:w-12 dark:border-slate-700 dark:border-t-medical-400",
        className
      )}
    />
  );
}

type AppLoaderProps = {
  message?: LoaderMessage | string;
  fullPage?: boolean;
  className?: string;
};

export function AppLoader({ message = "loading", fullPage = false, className }: AppLoaderProps) {
  const content = (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 px-6 text-center", className)}
      role="status"
      aria-live="polite"
    >
      <CircularLoader />
      <p className="max-w-xs text-sm font-medium text-slate-600 sm:text-base dark:text-slate-300">
        {resolveMessage(message)}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] w-full items-center justify-center bg-medical-50/80 dark:bg-slate-950">
        {content}
      </div>
    );
  }

  return content;
}

type LoadingOverlayProps = {
  active: boolean;
  message?: LoaderMessage | string;
};

export function LoadingOverlay({ active, message = "loading" }: LoadingOverlayProps) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/75 backdrop-blur-[2px] dark:bg-slate-950/75">
      <AppLoader message={message} />
    </div>
  );
}
