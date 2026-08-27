export interface Affiliation {
  name: string;
  role: string;
  color: string;
  /** single-color SVG mark, recolored to the brand color via CSS mask */
  asset: string;
  /** wider aspect for wordmark-style assets */
  wide?: boolean;
}

export interface Receipt {
  value: string;
  title: string;
  body: string;
  source: string;
  color: string;
  featured?: boolean;
  /** which micro-visualization the card renders */
  viz: 'steps' | 'podium' | 'spark' | 'bars';
  /** secondary metric chips under the viz */
  secondary: string[];
}

export interface ProjectMetric {
  value: string;
  label: string;
}

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  badge: string;
  accent: string;
  period: string;
  problem: string;
  built: string;
  measured: ProjectMetric[];
  stack: string[];
  links: ProjectLink[];
  /** cover image (GitHub OG card as live placeholder until real screenshots land) */
  image?: string;
}

export interface RoadStop {
  year: string;
  org: string;
  role: string;
  metric: string;
  color: string;
  current?: boolean;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://phong-portfolio.vercel.app';

export const SITE_CONTENT = {
  meta: {
    title: 'Phong Cao — AI Infrastructure & Distributed Systems',
    description:
      'Software engineer building AI infrastructure and distributed systems. Founder of FlashML at Zolli Labs, incoming SWE at NVIDIA, IEEE MIT URTC presenter.'
  },
  hero: {
    eyebrow: 'CHAPTER 00 — HELLO',
    statement: 'I build systems that survive failure.',
    sub: 'Founder of FlashML at Zolli Labs. Incoming software engineer at NVIDIA. BS Computer Science + MS Artificial Intelligence at WPI, class of 2027.'
  },
  links: {
    github: 'https://github.com/PhongCT1105',
    linkedin: 'https://www.linkedin.com/in/phong-cao/',
    resume: '/Phong_Cao_Resume.pdf',
    email: 'mailto:phongct1105@gmail.com'
  },
  affiliations: [
    { name: 'NVIDIA', role: 'INCOMING SWE', color: '#76b900', asset: '/assets/logos/nvidia.svg', wide: true },
    { name: 'Adobe', role: 'AMBASSADOR', color: '#fa0f00', asset: '/assets/logos/adobe.svg', wide: true },
    { name: 'Runpod', role: 'GRAND PRIZE', color: '#a78bfa', asset: '/assets/logos/runpod-mark.svg' },
    { name: 'NSF', role: 'REU RESEARCH', color: '#4a90d9', asset: '/assets/logos/nsf-mark.svg' },
    { name: 'IEEE', role: 'PRESENTED @ MIT URTC', color: '#00a0dc', asset: '/assets/logos/ieee-mark.svg' },
    { name: 'WPI', role: "BS + MS '27", color: '#e04050', asset: '/assets/logos/wpi-mark.svg' },
    { name: 'NASA', role: "PEOPLE'S CHOICE", color: '#4d7bf3', asset: '/assets/logos/nasa-space-apps-mark.svg' },
    { name: 'FPT', role: 'APPLIED AI · $30K', color: '#f26f21', asset: '/assets/logos/fpt-software-mark.svg' },
    { name: 'Zolli Labs', role: 'FOUNDER', color: '#9be15d', asset: '/assets/icons/founder.svg' }
  ] as Affiliation[],
  receipts: [
    {
      value: '$30K',
      title: 'Follow-on contract won',
      body: 'A proof-of-concept became production web + Android apps — and a signed $30K extension.',
      source: 'FPT SOFTWARE · INTERN · 2024',
      color: '#f26f21',
      viz: 'steps',
      secondary: ['97% RECALL@5', '300MS QUERIES', '5,000+ PHOTOS INDEXED']
    },
    {
      value: '$8K',
      title: 'Runpod Grand Prize',
      body: "FlashML took the grand prize at Runpod's hackathon — then kept shipping instead of stopping at the demo.",
      source: 'RUNPOD HACKATHON · 2026',
      color: '#a78bfa',
      viz: 'podium',
      secondary: ['GRAND PRIZE — TOP OF FIELD', '$8K CASH', 'SHIPPED AFTER THE WIN']
    },
    {
      value: '100+',
      title: 'Pilot users on PyPI',
      body: 'FlashML ships as installable Python packages with full CI/CD — real users, not a repo trophy.',
      source: 'ZOLLI LABS · FLASHML · LIVE',
      color: '#9be15d',
      featured: true,
      viz: 'spark',
      secondary: ['2,200+ TESTS', 'PYTORCH · SKLEARN · HF ADAPTERS', 'GITHUB ACTIONS CI/CD']
    },
    {
      value: '−60%',
      title: 'Forecast error, with RAG',
      body: 'RAG-grounded LLM feature selection over 157 exogenous features — presented at IEEE MIT URTC.',
      source: 'NSF RESEARCH · IEEE · 2025',
      color: '#00a0dc',
      viz: 'bars',
      secondary: ['157 FEATURES', '−27% VS XGBOOST BASELINE', '400+ REPRODUCIBLE RUNS']
    }
  ] as Receipt[],
  projects: [
    {
      slug: 'flashml',
      title: 'FlashML',
      tagline: 'Self-hostable distributed ML across heterogeneous compute — 47% faster batches, survives worker failures.',
      badge: 'GRAND PRIZE · RUNPOD · $8K',
      accent: '#9be15d',
      period: 'ZOLLI LABS · MAY 2026 — PRESENT',
      problem:
        'Spare GPUs are everywhere, but they are unequal, unreliable, and unsafe to share. Static schedulers waste the fast machines and lose work when the slow ones die.',
      built:
        'A pull-based distributed scheduler where fast workers claim more jobs, a sandboxed Docker host agent for safe compute sharing, and automatic resume after worker failures. Shipped as PyPI packages with PyTorch, scikit-learn, and Hugging Face adapters.',
      measured: [
        { value: '47%', label: 'FASTER BATCHES VS STATIC, 3.7× SPEED RANGE' },
        { value: '24', label: 'ADVERSARIAL ATTACKS BLOCKED, <0.25% MEM' },
        { value: '2,200+', label: 'TESTS · CI/CD · 100+ PILOT USERS' }
      ],
      stack: ['PYTHON', 'DOCKER', 'PYTORCH', 'HUGGING FACE', 'GITHUB ACTIONS'],
      links: [{ label: 'github.com/Zolli-Labs/flashml', url: 'https://github.com/Zolli-Labs/flashml' }],
      image: 'https://opengraph.githubassets.com/1/Zolli-Labs/flashml'
    },
    {
      slug: 'captain-ddoski',
      title: 'Captain Ddoski',
      tagline: 'Human-in-the-loop credibility infrastructure for AI agents.',
      badge: '2ND · UC BERKELEY AI HACKATHON',
      accent: '#7ba7ff',
      period: 'UC BERKELEY · 2026',
      problem:
        'Autonomous agents act confidently even when they are wrong. There is no trust layer telling humans when an agent should be believed — or stopped.',
      built:
        'A credibility layer that scores agent actions, routes low-confidence decisions to humans, and keeps an auditable trail of what the agent did and why.',
      measured: [
        { value: '2ND', label: 'OF THE UC BERKELEY AI HACKATHON FIELD' },
        { value: 'HITL', label: 'HUMAN-IN-THE-LOOP DECISION ROUTING' }
      ],
      stack: ['PYTHON', 'TYPESCRIPT', 'REACT'],
      links: [{ label: 'github.com/PhongCT1105/AI_Hack_Berkeley', url: 'https://github.com/PhongCT1105/AI_Hack_Berkeley' }],
      image: 'https://opengraph.githubassets.com/1/PhongCT1105/AI_Hack_Berkeley'
    },
    {
      slug: 'on-device-qa',
      title: 'On-Device Q&A',
      tagline: 'A real-estate Q&A model running fully offline on Android — 163ms latency on ARM64.',
      badge: 'EDGE AI · 163MS',
      accent: '#ffb45a',
      period: 'INDEPENDENT · MAY 2026',
      problem:
        'LLM assistants assume a datacenter. On-device inference means no network, tight memory, and mobile silicon — most models simply do not fit.',
      built:
        'Fine-tuned FLAN-T5, exported to ONNX, and built native Android inference with ONNX Runtime and C++ SentencePiece. Benchmarked 14 quantization and pruning variants to pick the deployable one.',
      measured: [
        { value: '163ms', label: 'LATENCY, DOWN FROM 5.48S' },
        { value: '50.5%', label: 'MODEL SIZE CUT (FP16)' },
        { value: '96.6%', label: 'TOKEN F1 RETAINED' }
      ],
      stack: ['ONNX RUNTIME', 'ANDROID ARM64', 'C++', 'HUGGING FACE'],
      links: [
        { label: 'github.com/PhongCT1105/On-Device-Real-Estate-Assistant', url: 'https://github.com/PhongCT1105/On-Device-Real-Estate-Assistant' }
      ],
      image: 'https://opengraph.githubassets.com/1/PhongCT1105/On-Device-Real-Estate-Assistant'
    },
    {
      slug: 'hospital-nav',
      title: 'Hospital Navigation',
      tagline: 'Full-stack hospital wayfinding platform over 147 kiosks — built leading a team of 11.',
      badge: 'PERN · 147 KIOSKS · LED 11 DEVS',
      accent: '#e04050',
      period: 'WPI × MASS GENERAL BRIGHAM · 2024',
      problem:
        'A hospital campus is a maze of buildings, floors, and service points. Patients need turn-by-turn directions from any of 147 kiosks — reliably, with access control.',
      built:
        'Led 11 students across 5 Agile sprints: Express/Prisma routing APIs, PostgreSQL on AWS, Auth0/JWT access control, and Dijkstra, A*, BFS, DFS pathfinding over the kiosk graph.',
      measured: [
        { value: '147', label: 'KIOSKS ROUTED' },
        { value: '11', label: 'DEVELOPERS LED · 5 SPRINTS' }
      ],
      stack: ['POSTGRESQL', 'EXPRESS', 'REACT', 'NODE', 'AWS', 'AUTH0'],
      links: []
    }
  ] as Project[],
  road: [
    {
      year: '2024',
      org: 'FPT Software',
      role: 'Applied AI intern — multimodal image search for 5,000+ photos.',
      metric: '97% RECALL@5 · $30K CONTRACT',
      color: '#f26f21'
    },
    {
      year: '2025',
      org: 'NSF Research',
      role: 'REU — LLM-guided feature selection for data-scarce forecasting.',
      metric: 'LLM-TSFS · IEEE MIT URTC',
      color: '#00a0dc'
    },
    {
      year: '2026',
      org: 'Adobe',
      role: 'AI product tester on Acrobat Student Spaces, invited back as ambassador.',
      metric: 'TESTER → AMBASSADOR',
      color: '#fa0f00'
    },
    {
      year: '2026 · NOW',
      org: 'Zolli Labs',
      role: 'Founder — building FlashML in the open, from prize to product.',
      metric: 'FLASHML · 100+ USERS',
      color: '#9be15d',
      current: true
    },
    {
      year: 'NEXT',
      org: 'NVIDIA',
      role: 'Software engineering — AI-assisted GPU validation workflows.',
      metric: 'INCOMING SWE',
      color: '#76b900'
    }
  ] as RoadStop[],
  honors: [
    'RUNPOD GRAND PRIZE',
    'STANFORD AI HACK — 3RD',
    'UC BERKELEY AI HACK — 2ND',
    "NASA SPACE APPS — PEOPLE'S CHOICE",
    'GOATHACKS ×2',
    'GPA 3.92 · PRESIDENTIAL SCHOLARSHIP',
    "WPI BS CS + MS AI · '27"
  ],
  now: {
    eyebrow: 'CHAPTER 04 — NOW',
    headline: 'Making mismatched machines act like one.',
    body: "FlashML's pull-based scheduler lets fast workers claim more jobs instead of assigning work blindly — batches finish 47% sooner across a 3.7× speed range. When a worker dies, its jobs go back to the queue instead of being lost.",
    tags: ['SCHEDULING', 'SANDBOXING', 'FAILURE RECOVERY'],
    next: 'Next chapter: AI-assisted GPU validation at NVIDIA.'
  }
};

export function formatRelationshipLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}
