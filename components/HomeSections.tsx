import ContactSection from "./home/ContactSection";
import CredibilitySection from "./home/CredibilitySection";
import FaqSection from "./home/FaqSection";
import ProblemSection from "./home/ProblemSection";
import ProcessSection from "./home/ProcessSection";
import ServicesSection from "./home/ServicesSection";
import TeamSection from "./home/TeamSection";
import WorkSection from "./home/WorkSection";

export default function HomeSections() {
  return (
    <>
      <CredibilitySection />
      <ProblemSection />
      <WorkSection />
      <ServicesSection />
      <TeamSection />
      <ProcessSection />
      <FaqSection />
      <ContactSection />
    </>
  );
}
