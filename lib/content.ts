export interface Affiliation {
  name: string;
  relationship: string;
  asset?: string;
  icon?: string;
}

export interface Project {
  number: string;
  title: string;
  description: string;
  recognition: string;
  marker: string;
  links: { label: string; url: string }[];
}

export interface Win {
  year: string;
  org: string;
  placement: string;
  project: string;
  marker: string;
}

export interface ExperienceItem {
  when: string;
  org: string;
  role: string;
  marker: string;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://phong-portfolio.vercel.app';

export const SITE_CONTENT = {
  meta: {
    title: 'Phong Cao — AI Infrastructure & Distributed Systems',
    description:
      'Software engineer building AI infrastructure and distributed systems. Incoming SWE at NVIDIA, Zolli AI founder, 10× hackathon winner, and AI/ML researcher.'
  },
  hero: {
    eyebrow: 'SOFTWARE ENGINEER · AI INFRASTRUCTURE',
    name: 'PHONG CAO',
    headline: 'I build systems.',
    scrambleWords: ['systems', 'infra', 'models', 'tools'],
    subhead: 'Distributed systems, AI infrastructure, and high-bandwidth technical work.',
    identity: [
      'Incoming SWE @ NVIDIA',
      'Founder @ Zolli AI',
      'AI Infrastructure / Distributed Systems',
      '10× Hackathon Winner',
      'Research @ IEEE MIT URTC',
      'BS + MS @ WPI'
    ]
  },
  links: {
    github: 'https://github.com/PhongCT1105',
    linkedin: 'https://www.linkedin.com/in/phong-cao/',
    resume: '/Phong_Cao_Resume.pdf',
    email: 'mailto:phongct1105@gmail.com'
  },
  affiliations: [
    { name: 'NVIDIA', relationship: 'Incoming SWE', asset: '/assets/logos/nvidia.svg' },
    { name: 'Adobe', relationship: 'Campus Ambassador', asset: '/assets/logos/adobe.svg' },
    { name: 'Runpod', relationship: 'Grand Prize / 1st Place', icon: '/assets/logos/runpod-mark.svg' },
    { name: 'NSF', relationship: 'REU / Research', icon: '/assets/logos/nsf-mark.svg' },
    { name: 'UC Berkeley', relationship: 'Hackathon Recognition', icon: '/assets/icons/trophy.svg' },
    { name: 'Stanford', relationship: 'Hackathon Recognition', icon: '/assets/icons/trophy.svg' },
    { name: 'IEEE', relationship: 'Research Presentation · MIT URTC', icon: '/assets/logos/ieee-mark.svg' },
    { name: 'WPI', relationship: 'BS + MS', icon: '/assets/logos/wpi-mark.svg' },
    { name: 'NASA Space Apps', relationship: "Local People's Choice", icon: '/assets/logos/nasa-space-apps-mark.svg' },
    { name: 'FPT Software', relationship: 'Applied AI / MLOps', icon: '/assets/logos/fpt-software-mark.svg' },
    { name: 'Zolli AI', relationship: 'Founder', icon: '/assets/icons/founder.svg' }
  ] as Affiliation[],
  numbers: [
    { value: '10×', label: 'HACKATHON WINS' },
    { value: '400+', label: 'RESEARCH EXPERIMENTS' },
    { value: '1ST', label: 'RUNPOD' },
    { value: 'IEEE @ MIT', label: 'RESEARCH PRESENTATION' },
    { value: 'BS + MS', label: 'WPI' }
  ],
  focus: {
    eyebrow: 'CURRENT OBSESSION',
    body: 'Exploring the utilization and communication bottlenecks that prevent fragmented GPU capacity from behaving like one useful pool of compute.',
    end: 'Make more compute useful.',
    tags: ['UTILIZATION', 'BANDWIDTH', 'PLACEMENT', 'COMMUNICATION', 'RECOVERY']
  },
  projects: [
    {
      number: '01',
      title: 'FlashML',
      description: 'Distributed ML infrastructure exploring fragmented compute.',
      recognition: '1ST · RUNPOD',
      marker: '/assets/logos/runpod-mark.svg',
      links: []
    },
    {
      number: '02',
      title: 'Captain Ddoski',
      description: 'Human-in-the-loop credibility infrastructure for AI agents.',
      recognition: 'UC BERKELEY',
      marker: '/assets/icons/trophy.svg',
      links: []
    },
    {
      number: '03',
      title: 'Cortex',
      description: 'AI learning diagnostics for faster feedback and intervention.',
      recognition: 'STANFORD',
      marker: '/assets/icons/trophy.svg',
      links: []
    },
    {
      number: '04',
      title: 'GPU Validation',
      description: 'AI-assisted test-plan and test-case generation for GPU validation workflows.',
      recognition: 'NVIDIA',
      marker: '/assets/logos/nvidia.svg',
      links: []
    }
  ] as Project[],
  wins: [
    { year: '2026', org: 'Runpod', placement: 'Grand Prize / 1st Place', project: 'FlashML', marker: '/assets/logos/runpod-mark.svg' },
    { year: '2026', org: 'UC Berkeley', placement: 'Hackathon Recognition', project: 'Captain Ddoski', marker: '/assets/icons/trophy.svg' },
    { year: '2026', org: 'Stanford', placement: 'Hackathon Recognition', project: 'Cortex', marker: '/assets/icons/trophy.svg' },
    { year: '2025', org: 'NASA Space Apps', placement: "Local People's Choice", project: 'NASA Space Apps', marker: '/assets/logos/nasa-space-apps-mark.svg' },
    { year: '2024–26', org: 'Additional Wins', placement: 'Six more hackathon wins', project: 'WPI + independent builds', marker: '/assets/icons/trophy.svg' }
  ] as Win[],
  research: {
    affiliations: ['NSF REU', 'IEEE MIT URTC'],
    headline: 'LLMs × Time Series × Retrieval',
    body: 'LLM-guided feature selection and retrieval-augmented forecasting for data-scarce time-series problems, validated through hundreds of controlled experiments.',
    metrics: [
      { value: '157', label: 'FEATURES' },
      { value: '400+', label: 'EXPERIMENTS' },
      { value: '−60%', label: 'RMSE VS NO RAG' },
      { value: 'IEEE @ MIT', label: 'PRESENTED' }
    ]
  },
  experience: [
    { when: 'NOW', org: 'NVIDIA', role: 'Software Engineering · GPU Validation', marker: '/assets/logos/nvidia.svg' },
    { when: 'NOW', org: 'Zolli AI', role: 'Founder', marker: '/assets/icons/founder.svg' },
    { when: 'PROGRAM', org: 'Adobe', role: 'Campus Ambassador', marker: '/assets/logos/adobe.svg' },
    { when: '2025–26', org: 'NSF REU', role: 'AI/ML Infrastructure Research', marker: '/assets/logos/nsf-mark.svg' },
    { when: '2024', org: 'FPT Software', role: 'Applied AI / MLOps', marker: '/assets/logos/fpt-software-mark.svg' }
  ] as ExperienceItem[],
  education: {
    institution: 'WORCESTER POLYTECHNIC INSTITUTE',
    degree: 'BS + MS',
    marker: '/assets/logos/wpi-mark.svg'
  }
};

export function formatRelationshipLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}
