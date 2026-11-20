"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/brand/logo";

const navLinks = [
  { href: "#who-its-for", label: "Why this exists" },
  { href: "#services", label: "What we do" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#care-team", label: "Clinicians" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`safe-top fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-medical-100 bg-white/90 shadow-sm shadow-medical-900/5 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center">
            <BrandLogo showTagline taglineClassName="hidden sm:block" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition hover:text-medical-600"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-medical-700 transition hover:bg-medical-50"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-medical-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-medical-600/25 transition hover:bg-medical-700 hover:shadow-medical-600/35"
            >
              Create account
            </Link>
          </div>

          <button
            type="button"
            className="touch-target rounded-lg text-medical-800 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-x-0 top-[72px] z-40 border-b border-medical-100 bg-white p-6 shadow-lg lg:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-slate-700"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-4">
                <Link href="/login" className="rounded-xl py-2.5 text-center font-semibold text-medical-700">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-medical-600 py-2.5 text-center font-semibold text-white"
                >
                  Create account
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
