"use client";

import { LandingNav } from "./landing-nav";
import { MedicalBackground } from "./medical-background";
import { HeroGroupBanner } from "./sections/hero-group-banner";
import { HeroSection } from "./sections/hero";
import { TrustBar } from "./sections/trust-bar";
import { WhoItsForSection } from "./sections/who-its-for";
import { ServicesSection } from "./sections/services";
import { HowItWorksSection } from "./sections/how-it-works";
import { CareTeamSection } from "./sections/care-team";
import { WhyUsSection } from "./sections/why-us";
import { TestimonialsSection } from "./sections/testimonials";
import { StatsSection } from "./sections/stats";
import { FaqSection } from "./sections/faq";
import { CtaBanner } from "./sections/cta-banner";
import { LandingFooter } from "./sections/footer";

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white text-slate-900">
      <MedicalBackground />
      <LandingNav />

      {/* Full-width clinic banner */}
      <HeroGroupBanner />

      <main className="relative">
        <HeroSection />
        <TrustBar />
        <WhoItsForSection />
        <ServicesSection />
        <HowItWorksSection />
        <CareTeamSection />
        <WhyUsSection />
        <StatsSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaBanner />
      </main>

      <LandingFooter />
    </div>
  );
}
