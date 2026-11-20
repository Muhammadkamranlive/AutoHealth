"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { landingImages } from "../images";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-medical-200 bg-medical-50 px-4 py-2 text-xs font-semibold text-medical-700"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            One clinic. Three people who need each other.
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-medical-950 sm:text-5xl"
          >
            Care that doesn&apos;t{" "}
            <span className="text-gradient-medical">drop the next person</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
          >
            HealthBridge is the clinic in the middle: patients get a treatment
            plan, licensed clinicians run the work, and gyms or med spas can
            refer someone in without losing them. One record. Messages, orders,
            documents, and payouts stay together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-2xl bg-medical-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-medical-600/30 transition hover:bg-medical-700"
            >
              Create a patient account
              <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-medical-200 bg-white px-8 py-4 text-base font-semibold text-medical-700 transition hover:border-medical-300 hover:bg-medical-50"
            >
              Staff or partner login
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-500"
          >
            {["Licensed clinicians", "One shared record", "HIPAA secure"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <svg className="h-5 w-5 text-medical-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 20 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl border-4 border-white shadow-2xl shadow-medical-900/10">
            <Image
              src={landingImages.heroGroup}
              alt="Clinicians and patients connected through HealthBridge"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-medical-900/40 via-transparent to-transparent" />
          </div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 top-8 rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:-left-8"
          >
            <p className="text-2xl font-bold text-medical-900">3 portals</p>
            <p className="text-xs text-slate-500">Patient, clinic, partner</p>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-2 bottom-16 rounded-2xl border border-white bg-white/95 p-3 shadow-xl sm:-right-6"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-medical-200">
                <Image
                  src={landingImages.team.asianPhysician}
                  alt="Dr. Sarah Chen"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-medical-900">Dr. Sarah Chen, MD</p>
                <p className="text-xs text-emerald-600">● Available now</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
