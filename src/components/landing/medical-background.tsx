"use client";

import { motion } from "framer-motion";

export function MedicalBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="medical-gradient absolute inset-0" />

      {/* Soft blue orbs */}
      <motion.div
        className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-medical-200/40 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 top-1/3 h-[380px] w-[380px] rounded-full bg-medical-400/20 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-sky-200/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 3D medical cross — floating */}
      <motion.div
        className="absolute right-[8%] top-[12%] hidden lg:block"
        animate={{ y: [0, -18, 0], rotateY: [0, 15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ perspective: 800 }}
      >
        <div className="relative h-20 w-20 rotate-12">
          <div className="absolute left-1/2 top-0 h-full w-5 -translate-x-1/2 rounded-full bg-gradient-to-b from-medical-400 to-medical-600 shadow-lg shadow-medical-500/30" />
          <div className="absolute left-0 top-1/2 h-5 w-full -translate-y-1/2 rounded-full bg-gradient-to-r from-medical-400 to-medical-600 shadow-lg shadow-medical-500/30" />
        </div>
      </motion.div>

      {/* 3D pill capsule */}
      <motion.div
        className="absolute left-[6%] top-[35%] hidden md:block"
        animate={{ y: [0, 22, 0], rotate: [12, 24, 12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="h-14 w-28 overflow-hidden rounded-full border border-white/60 shadow-xl shadow-medical-500/10">
          <div className="flex h-full">
            <div className="w-1/2 bg-white" />
            <div className="w-1/2 bg-gradient-to-br from-medical-400 to-medical-600" />
          </div>
        </div>
      </motion.div>

      {/* Glass diamond */}
      <motion.div
        className="absolute bottom-[18%] right-[15%] hidden lg:block"
        animate={{ y: [0, -14, 0], rotate: [45, 55, 45] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      >
        <div className="h-16 w-16 rotate-45 rounded-2xl border border-medical-200/80 bg-white/40 shadow-xl backdrop-blur-sm" />
      </motion.div>

      {/* DNA helix dots */}
      <motion.div
        className="absolute left-[12%] bottom-[25%] hidden xl:flex flex-col gap-3"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-2.5 w-2.5 rounded-full bg-medical-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-medical-600/40" />
          </div>
        ))}
      </motion.div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#1d4ed8 1px, transparent 1px), linear-gradient(90deg, #1d4ed8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
