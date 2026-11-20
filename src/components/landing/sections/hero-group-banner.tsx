"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { landingImages } from "../images";

export function HeroGroupBanner() {
  return (
    <section className="relative mt-[72px] h-[min(52vh,520px)] w-full overflow-hidden">
      <Image
        src={landingImages.headerGroup}
        alt="Diverse group of US doctors, nurses, and patients — Black, White, Asian, and Hispanic clinicians working together"
        fill
        className="object-cover object-center"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-medical-900/85 via-medical-800/70 to-medical-900/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-medical-950/50 via-transparent to-transparent" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-200">
            The clinic in the middle
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Patients, clinicians, and partners{" "}
            <span className="text-sky-200">on one record</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-medical-100 sm:text-lg">
            HealthBridge exists so care does not fall apart between the person
            who needs it, the clinician who reviews it, and the partner who
            sent them in.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-medical-700 shadow-xl transition hover:bg-medical-50"
            >
              Create an account
            </Link>
            <Link
              href="#care-team"
              className="rounded-2xl border-2 border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Meet our team
            </Link>
          </div>
        </motion.div>

        {/* Diverse face strip overlay */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="absolute bottom-6 right-6 hidden items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md lg:flex"
        >
          <div className="flex -space-x-3">
            {[
              landingImages.team.blackPhysician,
              landingImages.team.asianPhysician,
              landingImages.team.whiteNurse,
              landingImages.team.latinaNurse,
            ].map((src, i) => (
              <div
                key={src}
                className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-md"
                style={{ zIndex: 4 - i }}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="44px" />
              </div>
            ))}
          </div>
          <div className="pl-1 text-sm text-white">
            <p className="font-semibold">Licensed clinicians</p>
            <p className="text-xs text-medical-200">Reviewing real cases, together</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
