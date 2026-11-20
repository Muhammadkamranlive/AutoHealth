"use client";

import { motion } from "framer-motion";
import { Reveal } from "../motion";

const stats = [
  { display: "3", label: "Portals, one clinic" },
  { display: "1", label: "Shared patient record" },
  { display: "Roles", label: "that actually gate access" },
  { display: "HIPAA", label: "aligned by design" },
];

export function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-medical-700 py-20">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggIGQ9Ik0zNiAzNGg0djJoLTR6bTAtNGg0djJoLTR6bTAtNGg0djJoLTR6bTAtNGg0djJoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <motion.div
        className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-medical-500/30 blur-3xl"
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Built around the way a clinic actually works
          </h2>
          <p className="mt-3 text-medical-200">
            Patients, clinicians, and referring partners — not three separate products.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold text-white sm:text-5xl">{stat.display}</p>
              <p className="mt-2 text-sm font-medium text-medical-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
