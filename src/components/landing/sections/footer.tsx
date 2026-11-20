"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";
import { landingImages } from "../images";

const footerLinks = {
  Patients: [
    { label: "Create an account", href: "/signup" },
    { label: "Patient portal", href: "/login" },
    { label: "Prescription refills", href: "/signup" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Meet clinicians", href: "#care-team" },
  ],
  Providers: [
    { label: "Staff login", href: "/login" },
    { label: "Partner portal", href: "/login" },
    { label: "Join our network", href: "#care-team" },
    { label: "Clinical guidelines", href: "#" },
    { label: "Refer a patient", href: "/partner/refer" },
  ],
  Company: [
    { label: `About ${brand.name}`, href: "#" },
    { label: "HIPAA compliance", href: "#faq" },
    { label: "Careers", href: "#" },
    { label: "Press & media", href: "#" },
    { label: "Contact us", href: `mailto:${brand.supportEmail}` },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Accessibility (ADA)", href: "#" },
    { label: "Non-discrimination", href: "#" },
    { label: "State licensing", href: "#" },
  ],
};

const diverseFaces = [
  { src: landingImages.team.blackPhysician, alt: "Black physician" },
  { src: landingImages.team.asianPhysician, alt: "Asian physician" },
  { src: landingImages.team.whiteNurse, alt: "White nurse" },
  { src: landingImages.team.latinaNurse, alt: "Hispanic nurse" },
  { src: landingImages.testimonials.patient1, alt: "Patient" },
  { src: landingImages.testimonials.patient3, alt: "Patient" },
];

export function LandingFooter() {
  return (
    <footer id="footer" className="relative bg-medical-950 text-white">
      {/* Top CTA strip */}
      <div className="border-b border-white/10 bg-medical-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div>
            <h3 className="text-xl font-bold">Stay connected to this clinic</h3>
            <p className="mt-1 text-sm text-medical-200">
              Care reminders and product updates — not a marketing dump.
            </p>
          </div>
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-medical-300 focus:border-medical-400 focus:outline-none focus:ring-1 focus:ring-medical-400"
              aria-label="Email for newsletter"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-bold text-medical-800 transition hover:bg-medical-50"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Diverse team photo strip */}
      <div className="relative h-32 overflow-hidden border-b border-white/10 sm:h-40">
        <Image
          src={landingImages.diversePatients}
          alt="Diverse group of American patients and healthcare workers"
          fill
          className="object-cover opacity-60"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-medical-950 via-medical-950/80 to-medical-950" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center gap-6 px-6">
          <div className="flex -space-x-2">
            {diverseFaces.map((face) => (
              <div
                key={face.src}
                className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-medical-700 sm:h-14 sm:w-14"
              >
                <Image src={face.src} alt={face.alt} fill className="object-cover" sizes="56px" />
              </div>
            ))}
          </div>
          <p className="max-w-md text-sm text-medical-200">
            <span className="font-semibold text-white">The people in the middle of care.</span>{" "}
            Patients, clinicians, and referring partners — one clinic, not three silos.
          </p>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex">
              <BrandLogo inverted showTagline />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-medical-300">
              A virtual clinic that keeps patients, licensed clinicians, and
              referring partners on one record.
            </p>
            <div className="mt-6 space-y-2 text-sm text-medical-300">
              <p>1200 Healthcare Blvd, Suite 400</p>
              <p>Austin, TX 78701, United States</p>
              <p>
                <a href="tel:+18005551234" className="hover:text-white">
                  1-800-555-1234
                </a>
                {" · "}
                <a href={`mailto:${brand.supportEmail}`} className="hover:text-white">
                  {brand.supportEmail}
                </a>
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              {["HIPAA", "SOC 2", "HL7 FHIR", "ADA"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-medical-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-medical-300 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 lg:flex-row">
          <p className="text-center text-sm text-medical-400 lg:text-left">
            © {new Date().getFullYear()} {brand.legalName} All rights reserved.
            <span className="mx-2 hidden sm:inline">·</span>
            <br className="sm:hidden" />
            Delaware corporation · Licensed in all 50 US states
          </p>

          <div className="flex items-center gap-4">
            {[
              { label: "Twitter", href: "#" },
              { label: "LinkedIn", href: "#" },
              { label: "Facebook", href: "#" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-medium text-medical-300 transition hover:bg-medical-600 hover:text-white"
                aria-label={social.label}
              >
                {social.label[0]}
              </a>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-medical-400">
            <Link href="#" className="hover:text-white">Privacy</Link>
            <Link href="#" className="hover:text-white">Terms</Link>
            <Link href="#" className="hover:text-white">Accessibility</Link>
            <Link href="#" className="hover:text-white">Cookie settings</Link>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-medical-500">
          {brand.name} is not for medical emergencies. If you are experiencing a life-threatening
          emergency, call 911 or go to your nearest emergency room. Photos sourced from Pexels
          (free license) — stored locally in /public/images/landing/.
        </p>
      </div>
    </footer>
  );
}
