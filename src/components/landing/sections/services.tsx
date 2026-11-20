"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "../motion";
import { landingImages } from "../images";

const services = [
  {
    title: "Treatment plans & orders",
    description:
      "Clinicians put you on a plan. You can see status, request a refill, and stop guessing whether anything was actually ordered.",
    image: landingImages.services.primary,
    cta: "Start as a patient",
    href: "/signup",
  },
  {
    title: "Prescription refills",
    description:
      "Ask for a refill from your portal. A physician reviews it in the queue and the care team keeps the order moving.",
    image: landingImages.services.prescription,
    cta: "Request a refill",
    href: "/signup",
  },
  {
    title: "Ongoing care",
    description:
      "Chronic conditions need a coordinator, not a one-off visit. Care team messaging and follow-up live next to your plan.",
    image: landingImages.services.chronic,
    cta: "See how care works",
    href: "#how-it-works",
  },
  {
    title: "Labs & documents",
    description:
      "Upload results and keep visit files in your record. Staff can review them without a fax or a lost attachment.",
    image: landingImages.services.lab,
    cta: "Open the portal",
    href: "/login",
  },
  {
    title: "Intake & profile forms",
    description:
      "The clinic assigns the forms it actually needs. You complete them once; clinicians review a complete file, not a blank chart.",
    image: landingImages.services.mental,
    cta: "Create an account",
    href: "/signup",
  },
  {
    title: "Partner referrals & payouts",
    description:
      "Referring gyms, spas, and clinics send clients into licensed care, track those referrals, and get paid for the work of bringing people in.",
    image: landingImages.services.partner,
    cta: "Partner sign in",
    href: "/login",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-medical-50/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-medical-600">
            Our Services
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-medical-950 sm:text-4xl">
            What the clinic actually does
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Not a directory of random doctors. A working practice: plans, orders,
            messages, documents, and the partners who referred the patient.
          </p>
        </Reveal>

        <StaggerGrid className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <StaggerItem key={service.title}>
              <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-medical-900/40 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-medical-900">{service.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {service.description}
                  </p>
                  <Link
                    href={service.href}
                    className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-medical-600 transition group-hover:gap-2 hover:text-medical-700"
                  >
                    {service.cta} →
                  </Link>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
