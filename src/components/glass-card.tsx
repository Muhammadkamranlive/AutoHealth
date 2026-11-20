import { cn } from "@/components/ui/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "dark" | "light";
  hover?: boolean;
}

export function GlassCard({
  variant = "dark",
  hover = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === "dark" ? "glass-card" : "glass-card-light",
        hover && "hover:border-white/20 hover:bg-white/[0.1] hover:shadow-lg hover:shadow-teal-500/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
