import { SITE_CONTENT } from '@/lib/content';

const ACTIONS = [
  { label: 'GitHub', url: SITE_CONTENT.links.github, icon: '/assets/icons/github.svg' },
  { label: 'LinkedIn', url: SITE_CONTENT.links.linkedin, icon: '/assets/icons/linkedin.svg' },
  { label: 'Resume', url: SITE_CONTENT.links.resume, icon: '/assets/icons/resume.svg' },
  { label: 'Email', url: SITE_CONTENT.links.email, icon: '/assets/icons/mail.svg' }
];

export default function IconLinks() {
  return (
    <>
      {ACTIONS.map((action) => {
        const external = action.url.startsWith('http');
        return (
          <a
            key={action.label}
            className="icon-link magnetic"
            href={action.url}
            aria-label={action.label}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={action.icon} alt="" aria-hidden="true" />
            <span>{action.label}</span>
          </a>
        );
      })}
    </>
  );
}
