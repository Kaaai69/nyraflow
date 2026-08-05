import HomeSections from "@/components/HomeSections";
import ResponsiveHero from "@/components/ResponsiveHero";
import SplineWheelBridge from "@/components/SplineWheelBridge";
import SiteFooter from "@/components/home/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="site-main w-full overflow-x-clip bg-[#0B0C0E] text-[#F1F5F9]">
        <ResponsiveHero />
        <HomeSections />
      </main>
      <SplineWheelBridge />
      <SiteFooter />
    </>
  );
}
