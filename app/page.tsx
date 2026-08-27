import Boot from '@/components/Boot';
import CityLayer from '@/components/city/CityLayer';
import SmoothScroll from '@/components/SmoothScroll';
import CursorOrbit from '@/components/CursorOrbit';
import SiteNav from '@/components/SiteNav';
import Hero from '@/components/Hero';
import Receipts from '@/components/Receipts';
import WorkShelf from '@/components/WorkShelf';
import Road from '@/components/Road';
import NowSection from '@/components/NowSection';
import ContactSection from '@/components/ContactSection';
import Effects from '@/components/Effects';

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Boot />
      <CityLayer />
      <SmoothScroll />
      <div className="global-grid" aria-hidden="true" />
      <CursorOrbit />
      <SiteNav />

      <main id="main">
        <Hero />
        <Receipts />
        <WorkShelf />
        <Road />
        <NowSection />
        <ContactSection />
      </main>

      <Effects />
    </>
  );
}
