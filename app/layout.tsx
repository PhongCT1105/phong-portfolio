import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { SITE_CONTENT, SITE_URL } from '@/lib/content';

import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/layout.css';
import '@/styles/components.css';
import '@/styles/motion.css';
import '@/styles/responsive.css';
import '@/styles/v2.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_CONTENT.meta.title,
  description: SITE_CONTENT.meta.description,
  keywords: [
    'Phong Cao',
    'software engineer',
    'AI infrastructure',
    'distributed systems',
    'NVIDIA',
    'machine learning',
    'portfolio'
  ],
  authors: [{ name: 'Phong Cao', url: SITE_URL }],
  creator: 'Phong Cao',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: SITE_CONTENT.meta.title,
    description: SITE_CONTENT.meta.description,
    siteName: 'Phong Cao — Portfolio'
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONTENT.meta.title,
    description: SITE_CONTENT.meta.description
  },
  icons: { icon: [{ url: '/assets/icons/favicon.svg', type: 'image/svg+xml' }] },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: '#070907',
  colorScheme: 'dark'
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Phong Cao',
  url: SITE_URL,
  email: 'phongct1105@gmail.com',
  jobTitle: 'Software Engineer — AI Infrastructure & Distributed Systems',
  worksFor: { '@type': 'Organization', name: 'NVIDIA' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Worcester Polytechnic Institute' },
  sameAs: [SITE_CONTENT.links.github, SITE_CONTENT.links.linkedin]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <noscript>
          <style>{`.reveal{opacity:1;transform:none}.boot,.cursor-orbit{display:none}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
