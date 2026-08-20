import AnimatedServicesSection from "@/components/AnimatedServicesSection";
import ScrollRevealSection from "@/components/ScrollRevealSection";
import BenefitsSection from "./home/BenefitsSection";
import ContactSection from "./home/ContactSection";
import CredibilitySection from "./home/CredibilitySection";
import FaqSection from "./home/FaqSection";
import MetricsSection from "./home/MetricsSection";
import PricingSection from "./home/PricingSection";
import ProblemSection from "./home/ProblemSection";
import ProcessSection from "./home/ProcessSection";
import ServicesSection from "./home/ServicesSection";
import StarterSection from "./home/StarterSection";
import TeamSection from "./home/TeamSection";
import WorkSection from "./home/WorkSection";

export default function HomeSections() {
  return (
    <>
      <ScrollRevealSection>
        <CredibilitySection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <ProblemSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <MetricsSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <WorkSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <ServicesSection />
      </ScrollRevealSection>
      {/* EXISTING ANIMATION #2 - EXPLICITLY UNTOUCHED & UNWRAPPED */}
      <AnimatedServicesSection />
      <ScrollRevealSection>
        <StarterSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <PricingSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <TeamSection />
      </ScrollRevealSection>
      {/* Not wrapped: ProcessSection pins itself with position:sticky, and a
          transformed ancestor interferes with that. It brings its own reveals. */}
      <ProcessSection />
      <ScrollRevealSection>
        <FaqSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <BenefitsSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <ContactSection />
      </ScrollRevealSection>
    </>
  );
}

