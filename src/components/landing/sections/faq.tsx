"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "../motion";

const faqs = [
  {
    q: "What is HealthBridge, actually?",
    a: "It is a virtual clinic with three doors into the same record. Patients get care. Licensed clinicians review cases, write plans, and approve orders. Referral partners (gyms, med spas, other clinics) send people in and track payouts. The point is that those three groups stop working in isolation.",
  },
  {
    q: "Is this just another video-doctor app?",
    a: "No. HealthBridge is the operating desk of the clinic: intake forms, a review queue, treatment plans, refills, secure messages, documents, billing, and partner referrals. A video visit is only useful if the plan that follows it has a home.",
  },
  {
    q: "Who is it for?",
    a: "Patients who need ongoing care, not a one-off chat. Physicians and care coordinators who need a real queue. Administrators who assign menus and permissions. Partners who already have the client relationship and want a clean way to refer into licensed care.",
  },
  {
    q: "Are the clinicians licensed?",
    a: "Yes. Physicians and nurses on HealthBridge are US-licensed and credentialed. Care-team staff handle coordination and messaging; prescribing stays with licensed clinicians.",
  },
  {
    q: "Is my health information secure?",
    a: "Access is role-based and HIPAA-aligned. Patients see their own care. Staff see what their role allows. Partners see referral and payout status — not the full clinical chart. Data is encrypted in transit and at rest.",
  },
  {
    q: "How do staff and partners sign in?",
    a: "Your clinic administrator creates the account and assigns a role. Sign in on the login page — patients land in the patient portal, clinicians and admins in the staff workspace, partners in the partner portal.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-medical-50/50 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-medical-600">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-medical-950 sm:text-4xl">
            Straight answers
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 font-semibold text-medical-900">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: open === i ? 180 : 0 }}
                    className="shrink-0 text-medical-500"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="border-t border-medical-50 px-6 pb-5 pt-2 text-sm leading-relaxed text-slate-600">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
