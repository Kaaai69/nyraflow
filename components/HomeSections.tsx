import AnimatedServicesSection from "@/components/AnimatedServicesSection";
import ScrollRevealSection from "@/components/ScrollRevealSection";
import AutomationSection from "./home/AutomationSection";
import BenefitsSection from "./home/BenefitsSection";
import ContactSection from "./home/ContactSection";
import FaqSection from "./home/FaqSection";
import MetricsSection from "./home/MetricsSection";
import PricingSection from "./home/PricingSection";
import ProblemSection from "./home/ProblemSection";
import ProcessSection from "./home/ProcessSection";
import ServicesSquishySection from "./home/ServicesSquishySection";
import TeamSection from "./home/TeamSection";
import WorkSection from "./home/WorkSection";

export default function HomeSections() {
  return (
    <>
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
        <ServicesSquishySection />
      </ScrollRevealSection>
      {/* EXISTING ANIMATION #2 - EXPLICITLY UNTOUCHED & UNWRAPPED */}
      <AnimatedServicesSection />
      <ScrollRevealSection>
        <AutomationSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <PricingSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <BenefitsSection />
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
        <ContactSection />
      </ScrollRevealSection>
    </>
  );
}
