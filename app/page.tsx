import BackgroundWaves from "@/components/BackgroundWaves";
import HomeSections from "@/components/HomeSections";
import ResponsiveHero from "@/components/ResponsiveHero";
import ScrollRevealSection from "@/components/ScrollRevealSection";
import SiteFooter from "@/components/home/SiteFooter";

export default function Home() {
  return (
    <>
      <BackgroundWaves />
      <main className="site-main relative z-10 w-full overflow-x-clip bg-transparent text-[#F1F5F9]">
        {/* EXISTING ANIMATION #1 - EXPLICITLY UNTOUCHED & UNWRAPPED */}
        <ResponsiveHero />
        <HomeSections />
      </main>
      <ScrollRevealSection className="relative z-10">
        <SiteFooter />
      </ScrollRevealSection>
    </>
  );
}

