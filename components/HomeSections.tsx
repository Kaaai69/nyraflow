import VideoScrollAnimation1 from "@/components/VideoScrollAnimation1";
import VideoScrollAnimation2 from "@/components/VideoScrollAnimation2";
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
      <CredibilitySection />
      <ProblemSection />
      <MetricsSection />
      <WorkSection />
      <VideoScrollAnimation1 />
      <StarterSection />
      <PricingSection />
      <ServicesSection />
      <VideoScrollAnimation2 />
      <TeamSection />
      <ProcessSection />
      <FaqSection />
      <BenefitsSection />
      <ContactSection />
    </>
  );
}
