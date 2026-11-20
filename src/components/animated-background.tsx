"use client";

import { motion } from "framer-motion";

export function AnimatedBackground({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={isDark ? "gradient-mesh absolute inset-0" : "gradient-mesh-light absolute inset-0"} />

      <motion.div
        className={`absolute -left-20 top-1/4 h-72 w-72 rounded-full blur-3xl ${
          isDark ? "bg-teal-500/20" : "bg-teal-400/30"
        }`}
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute -right-16 top-1/3 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-indigo-500/15" : "bg-indigo-400/20"
        }`}
        animate={{ x: [0, -25, 0], y: [0, 25, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className={`absolute bottom-0 left-1/3 h-64 w-64 rounded-full blur-3xl ${
          isDark ? "bg-cyan-500/10" : "bg-cyan-400/15"
        }`}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* 3D-ish glass shapes */}
      <div className="absolute left-[8%] top-[18%] animate-float">
        <div className="h-24 w-24 rotate-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl backdrop-blur-sm" />
      </div>
      <div className="absolute right-[12%] top-[22%] animate-float-delayed">
        <div className="h-16 w-16 -rotate-6 rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-400/20 to-transparent shadow-xl backdrop-blur-sm" />
      </div>
      <div className="absolute bottom-[20%] right-[20%] animate-pulse-soft">
        <div className="h-20 w-20 rotate-45 rounded-full border border-indigo-400/15 bg-gradient-to-br from-indigo-400/10 to-transparent backdrop-blur-sm" />
      </div>
    </div>
  );
}
