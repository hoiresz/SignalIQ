export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  leads?: Lead[];
}

export interface Lead {
  id: string;
  type: 'company' | 'person';
  name: string;
  data: Record<string, any>;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  messages: Message[];
  leads: Lead[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  company_website: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdealCustomerProfile {
  id: string;
  user_id: string;
  name: string;
  solution_products: string;
  target_region: string[];
  target_customers: string;
  company_sizes: string[];
  funding_stages: string[];
  locations: string[];
  titles: string;
  created_at: string;
  updated_at: string;
}

export interface LeadSignal {
  id: string;
  user_id: string;
  icp_id: string;
  name: string;
  description: string;
  signal_type: 'ai_generated' | 'custom';
  criteria: {
    company_sizes?: string[];
    funding_stages?: string[];
    target_people_criteria?: string;
    signal_description?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadTable {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  table_type: 'companies' | 'people' | 'custom';
  default_columns: any[];
  created_at: string;
  updated_at: string;
  lead_count?: number;
}

type ActiveTab = 'leads' | 'settings' | 'campaigns' | 'signals';