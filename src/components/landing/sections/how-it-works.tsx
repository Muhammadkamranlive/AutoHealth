"use client";

import { Reveal, StaggerGrid, StaggerItem } from "../motion";

const steps = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up as a patient in a couple of minutes. Staff and partners receive a login from the clinic — your role opens the right portal.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Share your health story",
    description:
      "Complete the intake and profile forms your clinic assigns. That file is what the care team actually reviews — not a voicemail.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "A clinician reviews your case",
    description:
      "Physicians and care coordinators work a real review queue. They approve orders, ask follow-up questions, and put you on a plan.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Stay on the plan",
    description:
      "Refills, documents, billing, and messages live in your portal. If a partner referred you, they can see the referral — not your private chart.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white py-24">
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-medical-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-medical-600">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-medical-950 sm:text-4xl">
            From signup to a living care plan
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            No extra app to install. Patients, staff, and partners each get the
            portal that matches their job.
          </p>
        </Reveal>

        <StaggerGrid className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <StaggerItem key={item.step}>
              <div className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-medical-300 to-medical-100 lg:block" />
                )}
                <div className="relative rounded-2xl border border-medical-100 bg-white p-6 shadow-sm transition hover:border-medical-200 hover:shadow-lg">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-medical-600 text-white shadow-lg shadow-medical-600/25">
                    {item.icon}
                  </div>
                  <span className="mt-4 block text-xs font-bold uppercase tracking-widest text-medical-400">
                    Step {item.step}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-medical-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
