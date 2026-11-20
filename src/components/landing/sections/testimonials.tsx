"use client";

import Image from "next/image";
import { Reveal, StaggerGrid, StaggerItem } from "../motion";
import { landingImages } from "../images";

const testimonials = [
  {
    quote:
      "I used to screenshot lab results into a group chat. Now my plan, refills, and messages with the care team are in one place. I finally know what happens next.",
    name: "Jennifer K.",
    location: "Patient · Austin, TX",
    image: landingImages.testimonials.patient1,
  },
  {
    quote:
      "We refer clients from the gym every week. Before HealthBridge we lost them after the handshake. Now I can see the referral landed — without reading anyone's chart.",
    name: "Marcus D.",
    location: "Referral partner · Chicago, IL",
    image: landingImages.testimonials.patient2,
  },
  {
    quote:
      "The review queue is the job. Intake forms come in complete, I approve the order, the care team follows up. That is a clinic, not a waiting room with a webcam.",
    name: "Dr. Sarah Chen",
    location: "Physician · San Francisco, CA",
    image: landingImages.testimonials.patient3,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-medical-600">
            Patient, partner &amp; clinician stories
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-medical-950 sm:text-4xl">
            Why people stay on HealthBridge
          </h2>
        </Reveal>

        <StaggerGrid className="mt-16 grid gap-8 lg:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <div className="flex h-full flex-col rounded-2xl border border-medical-100 bg-medical-50/30 p-8 transition hover:shadow-lg">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-slate-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-medical-100 pt-6">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-medical-200">
                    <Image src={t.image} alt={t.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div>
                    <p className="font-semibold text-medical-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.location}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
