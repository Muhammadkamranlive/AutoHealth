"use client";

import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "../motion";

const audiences = [
  {
    eyebrow: "Patients",
    title: "Get care you can actually follow",
    body: "Create an account, share your history, and work with a licensed clinician. Treatment plans, refills, lab files, and messages stay in one portal — not five apps and a paper printout.",
    href: "/signup",
    cta: "Create a patient account",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    eyebrow: "Clinicians & care team",
    title: "Run the clinic from a real workbench",
    body: "Review incoming cases, approve orders, message patients, and assign intake forms. Physicians prescribe. Care coordinators keep the queue moving. Administrators control who sees what.",
    href: "/login",
    cta: "Staff sign in",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    eyebrow: "Referral partners",
    title: "Send a client. Stay in the loop.",
    body: "Gyms, med spas, and referring clinics already have the relationship. HealthBridge lets you send someone into licensed care, track the referral, and get paid — without losing them after the handshake.",
    href: "/login",
    cta: "Partner sign in",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
  },
];

export function WhoItsForSection() {
  return (
    <section id="who-its-for" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-medical-600">
            Why this exists
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl lg:text-4xl">
            Care falls apart when people don&apos;t share a record
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Patients wait. Clinicians chase inboxes. A trainer or spa who referred
            someone never hears back. HealthBridge is the clinic that holds those
            three sides together.
          </p>
        </Reveal>

        <StaggerGrid className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-3">
          {audiences.map((item) => (
            <StaggerItem key={item.eyebrow}>
              <article className="flex h-full min-w-0 flex-col rounded-2xl border border-medical-100 bg-medical-50/40 p-6 sm:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-medical-600 text-white shadow-lg shadow-medical-600/25">
                  {item.icon}
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-medical-500">
                  {item.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-bold text-medical-900">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-medical-600 hover:text-medical-700"
                >
                  {item.cta} →
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
