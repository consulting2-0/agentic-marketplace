import type { FeaturedItem } from './types';

export const COMPONENTS_JSON_URL =
  import.meta.env.PUBLIC_COMPONENTS_JSON_URL ?? '/components.json';

export const ITEMS_PER_PAGE = 24;

export const FEATURED_ITEMS: FeaturedItem[] = [
  {
    name: 'SAP Integration Suite',
    description: 'Complete iFlow & API Management Template Pack',
    logo: 'https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg',
    url: '/featured/integration-suite',
    tag: 'Integration',
    tagColor: '#0070F2',
    category: 'SAP BTP',
    ctaLabel: 'Explore Templates',
    ctaUrl: 'https://help.sap.com/docs/integration-suite',
    websiteUrl: 'https://help.sap.com/docs/integration-suite',
    installCommand: 'npx c20-claude-template@latest --agent integration-suite/iflow-developer --yes',
    metadata: {
      Agents: '6',
      Coverage: 'iFlow, API, EDI',
      Platform: 'SAP BTP',
    },
    links: [
      { label: 'SAP Integration Suite Docs', url: 'https://help.sap.com/docs/integration-suite' },
      { label: 'SAP API Business Hub', url: 'https://api.sap.com' },
      { label: 'BTP Discovery Center', url: 'https://discovery-center.cloud.sap' },
    ],
  },
  {
    name: 'CAP Framework',
    description: 'Cloud Application Programming Model Templates',
    logo: 'https://cap.cloud.sap/docs/assets/logos/cap.svg',
    url: '/featured/cap-development',
    tag: 'CAP',
    tagColor: '#00C8C8',
    category: 'SAP BTP',
    ctaLabel: 'Explore CAP Templates',
    ctaUrl: 'https://cap.cloud.sap/docs/',
    websiteUrl: 'https://cap.cloud.sap/docs/',
    installCommand: 'npx c20-claude-template@latest --agent cap-development/cap-nodejs-developer --yes',
    metadata: {
      Agents: '5',
      Coverage: 'Node.js, Java, CDS',
      Platform: 'SAP BTP',
    },
    links: [
      { label: 'CAP Documentation', url: 'https://cap.cloud.sap/docs/' },
      { label: 'CAP Samples', url: 'https://github.com/SAP-samples/cloud-cap-samples' },
      { label: 'CAP on BTP', url: 'https://discovery-center.cloud.sap/serviceCatalog/sap-cloud-application-programming-model' },
    ],
  },
  {
    name: 'SAP AI Foundation',
    description: 'GenAI Hub, AI Core & Joule Extension Templates',
    logo: 'https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg',
    url: '/featured/ai-foundation',
    tag: 'AI / Joule',
    tagColor: '#7C3AED',
    category: 'SAP BTP AI',
    ctaLabel: 'Explore AI Templates',
    ctaUrl: 'https://help.sap.com/docs/sap-ai-core',
    websiteUrl: 'https://help.sap.com/docs/sap-ai-core',
    installCommand: 'npx c20-claude-template@latest --agent ai-foundation/genai-hub-developer --yes',
    metadata: {
      Agents: '4',
      Coverage: 'GenAI Hub, AI Core, Joule',
      Platform: 'SAP BTP',
    },
    links: [
      { label: 'SAP AI Core Docs', url: 'https://help.sap.com/docs/sap-ai-core' },
      { label: 'Generative AI Hub', url: 'https://help.sap.com/docs/generative-ai-hub' },
      { label: 'SAP Joule', url: 'https://www.sap.com/products/artificial-intelligence/ai-assistant.html' },
    ],
  },
];

export const NAV_LINKS = {
  github: 'https://github.com/sghosh13/btp-templates',
  docs: 'https://help.sap.com/docs/btp',
  blog: 'https://community.sap.com/topics/btp',
  trending: '/trending',
};
