"use client";

import { Reveal } from "../motion";

const badges = [
  { label: "HIPAA aligned", icon: "🛡️" },
  { label: "Licensed clinicians", icon: "🩺" },
  { label: "Role-based access", icon: "🔑" },
  { label: "Partner referrals", icon: "🤝" },
  { label: "Encrypted records", icon: "🔒" },
];

export function TrustBar() {
  return (
    <section className="border-y border-medical-100 bg-white py-8">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-medical-500">
            What holds the clinic together
          </p>
        </Reveal>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {badges.map((badge, i) => (
            <Reveal key={badge.label} delay={i * 0.05}>
              <div className="flex items-center gap-2 rounded-full border border-medical-100 bg-medical-50/50 px-5 py-2.5 text-sm font-medium text-medical-800">
                <span>{badge.icon}</span>
                {badge.label}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
