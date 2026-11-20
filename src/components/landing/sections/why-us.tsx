"use client";

import Image from "next/image";
import { Reveal, StaggerGrid, StaggerItem } from "../motion";
import { landingImages } from "../images";

const reasons = [
  {
    title: "One record, not five inboxes",
    description:
      "Treatment plans, orders, documents, and messages sit together. Patients stop repeating themselves. Clinicians stop hunting.",
  },
  {
    title: "A workbench for the clinic, not a Zoom link",
    description:
      "Review queues, order approval, assigned forms, and role-based access are how a real practice runs — HealthBridge is built for that.",
  },
  {
    title: "Partners stay in the loop",
    description:
      "A gym or med spa can refer a client, see the referral status, and receive payouts without ever opening the patient's private chart.",
  },
  {
    title: "Privacy is the default",
    description:
      "HIPAA-aligned access: patients see their own care, staff see what their role allows, partners see only their referrals.",
  },
];

export function WhyUsSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-widest text-medical-600">
              Why HealthBridge
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-medical-950 sm:text-4xl">
              Built like a clinic, not a chatbot
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Licensed clinicians still make the medical decisions. HealthBridge
              is the place those decisions, the patient, and the referring
              partner can all live without dropping the thread.
            </p>

            <StaggerGrid className="mt-10 space-y-6">
              {reasons.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-medical-100 text-medical-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-medical-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src={landingImages.whyUs.nurse}
                    alt="Hispanic nurse providing patient care"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src={landingImages.whyUs.doctor}
                    alt="Black physician consulting with patient"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-4 rounded-2xl border border-medical-100 bg-white p-5 shadow-xl sm:-right-8">
                <p className="text-3xl font-bold text-medical-600">1</p>
                <p className="text-sm text-slate-600">Shared clinical record</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
