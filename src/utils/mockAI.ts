import { Lead } from '../types';

// Mock AI responses with realistic data
export const generateMockResponse = async (query: string): Promise<{ content: string; leads?: Lead[] }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const lowerQuery = query.toLowerCase();

  // Generate leads based on query content
  let leads: Lead[] = [];
  let content = '';

  if (lowerQuery.includes('web3') || lowerQuery.includes('blockchain') || lowerQuery.includes('crypto')) {
    content = "I found several Web3 companies that raised less than $5M in the last 6 months. Here are the results:";
    leads = generateWeb3Companies();
  } else if (lowerQuery.includes('saas') || lowerQuery.includes('software')) {
    content = "Here are SaaS companies matching your criteria:";
    leads = generateSaasCompanies();
  } else if (lowerQuery.includes('headcount') || lowerQuery.includes('employees')) {
    content = "I've added headcount information to the existing results:";
    leads = addHeadcountInfo(leads);
  } else if (lowerQuery.includes('uk') || lowerQuery.includes('singapore')) {
    content = "I've filtered the results to show only companies in the UK and Singapore:";
    leads = filterByLocation(['UK', 'Singapore']);
  } else if (lowerQuery.includes('more companies') || lowerQuery.includes('show more')) {
    content = "Here are additional companies matching your criteria:";
    leads = generateMoreCompanies();
  } else if (lowerQuery.includes('person') || lowerQuery.includes('people') || lowerQuery.includes('founder') || lowerQuery.includes('ceo')) {
    content = "I found several key people matching your criteria:";
    leads = generatePeople();
  } else {
    content = "I found several companies and people matching your criteria. Let me know if you'd like me to refine the search or add additional information.";
    leads = generateMixedResults();
  }

  return { content, leads };
};

const generateWeb3Companies = (): Lead[] => [
  {
    id: '1',
    type: 'company',
    name: 'DecentralHub',
    data: {
      industry: 'Web3 Infrastructure',
      fundingRaised: '$3.2M',
      lastFunding: '4 months ago',
      location: 'Singapore',
      website: 'https://decentralhub.io',
      employees: '12-25',
      stage: 'Seed',
      description: 'Building decentralized storage solutions'
    },
    createdAt: new Date()
  },
  {
    id: '2',
    type: 'company',
    name: 'ChainWorks',
    data: {
      industry: 'Blockchain Development',
      fundingRaised: '$4.8M',
      lastFunding: '2 months ago',
      location: 'London, UK',
      website: 'https://chainworks.com',
      employees: '25-50',
      stage: 'Series A',
      description: 'Smart contract development platform'
    },
    createdAt: new Date()
  },
  {
    id: '3',
    type: 'company',
    name: 'CryptoStream',
    data: {
      industry: 'DeFi',
      fundingRaised: '$2.1M',
      lastFunding: '5 months ago',
      location: 'Berlin, Germany',
      website: 'https://cryptostream.fi',
      employees: '8-15',
      stage: 'Pre-Seed',
      description: 'Decentralized streaming protocol'
    },
    createdAt: new Date()
  }
];

const generateSaasCompanies = (): Lead[] => [
  {
    id: '4',
    type: 'company',
    name: 'DataFlow Pro',
    data: {
      industry: 'Data Analytics',
      fundingRaised: '$6.5M',
      lastFunding: '3 months ago',
      location: 'San Francisco, CA',
      website: 'https://dataflowpro.com',
      employees: '35-75',
      stage: 'Series A',
      description: 'Enterprise data visualization platform'
    },
    createdAt: new Date()
  },
  {
    id: '5',
    type: 'company',
    name: 'TeamSync',
    data: {
      industry: 'Productivity Software',
      fundingRaised: '$4.2M',
      lastFunding: '1 month ago',
      location: 'Austin, TX',
      website: 'https://teamsync.app',
      employees: '20-40',
      stage: 'Seed',
      description: 'Remote team collaboration tools'
    },
    createdAt: new Date()
  }
];

const generatePeople = (): Lead[] => [
  {
    id: '6',
    type: 'person',
    name: 'Sarah Chen',
    data: {
      title: 'CEO & Founder',
      company: 'DecentralHub',
      location: 'Singapore',
      linkedin: 'https://linkedin.com/in/sarahchen',
      email: 'sarah@decentralhub.io',
      experience: '8 years',
      previousCompany: 'Google',
      education: 'Stanford University'
    },
    createdAt: new Date()
  },
  {
    id: '7',
    type: 'person',
    name: 'Marcus Weber',
    data: {
      title: 'CTO',
      company: 'ChainWorks',
      location: 'London, UK',
      linkedin: 'https://linkedin.com/in/marcusweber',
      email: 'marcus@chainworks.com',
      experience: '12 years',
      previousCompany: 'Microsoft',
      education: 'MIT'
    },
    createdAt: new Date()
  }
];

const generateMixedResults = (): Lead[] => [
  ...generateWeb3Companies().slice(0, 2),
  ...generatePeople().slice(0, 1),
  ...generateSaasCompanies().slice(0, 1)
];

const generateMoreCompanies = (): Lead[] => [
  {
    id: '8',
    type: 'company',
    name: 'InnovateLabs',
    data: {
      industry: 'AI/ML',
      fundingRaised: '$7.8M',
      lastFunding: '6 months ago',
      location: 'Toronto, Canada',
      website: 'https://innovatelabs.ai',
      employees: '40-80',
      stage: 'Series A',
      description: 'Machine learning infrastructure'
    },
    createdAt: new Date()
  }
];

const addHeadcountInfo = (existingLeads: Lead[]): Lead[] => {
  return existingLeads; // In real implementation, would add headcount data
};

const filterByLocation = (locations: string[]): Lead[] => {
  return generateWeb3Companies().filter(lead => 
    locations.some(loc => lead.data.location?.includes(loc))
  );
};