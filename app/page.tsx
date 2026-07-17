import HomeSections from "@/components/HomeSections";
import ResponsiveHero from "@/components/ResponsiveHero";
import SplineWheelBridge from "@/components/SplineWheelBridge";
import SiteFooter from "@/components/home/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="site-main w-full overflow-x-clip bg-canvas text-text-primary">
        <ResponsiveHero />
        <HomeSections />
      </main>
      <SplineWheelBridge />
      <SiteFooter />
    </>
  );
}
