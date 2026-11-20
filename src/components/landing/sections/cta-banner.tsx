"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "../motion";
import { landingImages } from "../images";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            <div className="relative min-h-[320px]">
              <Image
                src={landingImages.cta}
                alt="Diverse healthcare team at US medical facility"
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-medical-900/95 via-medical-800/85 to-medical-700/70" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center px-8 py-16 sm:px-16">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  Ready to be on the same record?
                </h2>
                <p className="mt-4 text-lg text-medical-100">
                  Patients start here. Clinicians and partners sign in with the
                  login their clinic issued.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="rounded-2xl bg-white px-8 py-4 text-base font-bold text-medical-700 shadow-xl transition hover:bg-medical-50"
                  >
                    Create a patient account
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-2xl border-2 border-white/40 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Staff or partner sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
