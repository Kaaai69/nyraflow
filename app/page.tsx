import HomeSections from "@/components/HomeSections";
import ScrollHero from "@/components/ScrollHero";
import SiteFooter from "@/components/home/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="site-main w-full overflow-x-clip bg-canvas text-text-primary">
        <ScrollHero />
        <HomeSections />
      </main>
      <SiteFooter />
    </>
  );
}
