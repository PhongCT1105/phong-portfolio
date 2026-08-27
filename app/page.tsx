import Boot from '@/components/Boot';
import NetworkCanvas from '@/components/NetworkCanvas';
import CursorOrbit from '@/components/CursorOrbit';
import SiteNav from '@/components/SiteNav';
import Hero from '@/components/Hero';
import AffiliationRail from '@/components/AffiliationRail';
import NumbersSection from '@/components/NumbersSection';
import FocusSection from '@/components/FocusSection';
import WorkSection from '@/components/WorkSection';
import WinsSection from '@/components/WinsSection';
import ResearchSection from '@/components/ResearchSection';
import ExperienceSection from '@/components/ExperienceSection';
import EducationSection from '@/components/EducationSection';
import ContactSection from '@/components/ContactSection';
import Effects from '@/components/Effects';

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Boot />
      <NetworkCanvas />
      <div className="global-grid" aria-hidden="true" />
      <CursorOrbit />
      <SiteNav />

      <main id="main">
        <Hero />
        <AffiliationRail />
        <NumbersSection />
        <FocusSection />
        <WorkSection />
        <WinsSection />
        <ResearchSection />
        <ExperienceSection />
        <EducationSection />
        <ContactSection />
      </main>

      <Effects />
    </>
  );
}
