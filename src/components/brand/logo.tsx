import { brand } from "@/lib/brand";
import { cn } from "@/components/ui";

type MarkSize = "sm" | "md" | "lg";

const markBox: Record<MarkSize, string> = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

const markIcon: Record<MarkSize, string> = {
  sm: "h-[18px] w-[18px]",
  md: "h-5 w-5",
  lg: "h-[22px] w-[22px]",
};

/** Bridge + plus mark — the HealthBridge identity. */
export function BrandMark({
  size = "md",
  className,
}: {
  size?: MarkSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-medical-500 to-medical-700 text-white shadow-md shadow-medical-600/25",
        markBox[size],
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className={markIcon[size]} fill="none">
        <path
          d="M4 18V11.2C4 9.4 5.2 7.8 7 7.2L12 5.5L17 7.2C18.8 7.8 20 9.4 20 11.2V18"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 18V13.5C7 12.7 7.7 12 8.5 12H15.5C16.3 12 17 12.7 17 13.5V18"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M12 9.2V14.8M9.4 12H14.6"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

type LogoProps = {
  size?: MarkSize;
  showTagline?: boolean;
  tagline?: string;
  inverted?: boolean;
  className?: string;
  taglineClassName?: string;
};

export function BrandLogo({
  size = "md",
  showTagline = false,
  tagline = brand.shortTagline,
  inverted = false,
  className,
  taglineClassName,
}: LogoProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark size={size} className={inverted ? "shadow-none" : undefined} />
      <span className="min-w-0 text-left">
        <span
          className={cn(
            "block truncate font-bold tracking-tight",
            size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-lg",
            inverted ? "text-white" : "text-medical-900 dark:text-white"
          )}
        >
          {brand.name}
        </span>
        {showTagline && (
          <span
            className={cn(
              "block truncate text-[10px] font-semibold uppercase tracking-widest",
              inverted ? "text-medical-300" : "text-medical-500 dark:text-slate-400",
              taglineClassName
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
