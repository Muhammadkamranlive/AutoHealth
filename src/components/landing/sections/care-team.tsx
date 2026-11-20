"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "../motion";
import { landingImages } from "../images";

const team = [
  {
    name: "Dr. James Mitchell, MD",
    role: "Chief Medical Officer",
    specialty: "Internal Medicine · Johns Hopkins",
    image: landingImages.team.blackPhysician,
    licensed: "CA, NY, TX, FL",
    background: "African American",
  },
  {
    name: "Dr. Sarah Chen, MD",
    role: "Telehealth Physician",
    specialty: "Family Medicine · UCLA",
    image: landingImages.team.asianPhysician,
    licensed: "CA, WA, OR, HI",
    background: "Chinese American",
  },
  {
    name: "Emily Rodriguez, RN, BSN",
    role: "Director of Nursing",
    specialty: "Critical Care · Mayo Clinic",
    image: landingImages.team.latinaNurse,
    licensed: "AZ, NV, CO, TX",
    background: "Hispanic American",
  },
  {
    name: "Dr. Rachel Thompson, DNP",
    role: "Clinical Care Lead",
    specialty: "Family Nurse Practitioner · Penn",
    image: landingImages.team.whiteNurse,
    licensed: "PA, NJ, DE, MD",
    background: "Caucasian American",
  },
];

export function CareTeamSection() {
  return (
    <section id="care-team" className="bg-gradient-to-b from-medical-50 to-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-medical-600">
            Our Clinical Team
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-medical-950 sm:text-4xl">
            Licensed clinicians who review the work
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Physicians prescribe. Nurses and care coordinators keep the queue
            honest. You are not matched to a random stranger on a marketplace.
          </p>
        </Reveal>

        <StaggerGrid className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <StaggerItem key={member.name}>
              <div className="group overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={member.image}
                    alt={`${member.name}, ${member.role}`}
                    fill
                    className="object-cover object-top transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-medical-900/80 via-medical-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <p className="font-bold">{member.name}</p>
                    <p className="text-sm text-medical-100">{member.role}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-600">{member.specialty}</p>
                  <p className="mt-1 text-xs font-medium text-medical-500">{member.background}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-medical-600">
                    Licensed: {member.licensed}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>

        <Reveal className="mt-12 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-medical-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-medical-700"
          >
            Join this clinic
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
