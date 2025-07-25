import { User, Message, Lead, Conversation, UserProfile, IdealCustomerProfile, LeadSignal } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Auth endpoints
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async verifyToken(): Promise<{ valid: boolean; user_id: string }> {
    return this.request<{ valid: boolean; user_id: string }>('/auth/verify', {
      method: 'POST',
    });
  }

  // Lead generation endpoints
  async generateLeads(query: string, leadTableId: string) {
    return this.request('/leads/generate', {
      method: 'POST',
      body: JSON.stringify({
        query,
        lead_table_id: leadTableId,
      }),
    });
  }

  async getTableLeads(tableId: string) {
    return this.request(`/leads/tables/${tableId}`);
  }

  // Lead Tables endpoints
  async getLeadTables(): Promise<any[]> {
    return this.request<any[]>('/lead-tables');
  }

  async createLeadTable(name: string, description?: string): Promise<any> {
    return this.request('/lead-tables', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async getLeadTable(id: string): Promise<any> {
    return this.request(`/lead-tables/${id}`);
  }

  async updateLeadTable(id: string, data: { name?: string; description?: string }): Promise<any> {
    return this.request(`/lead-tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLeadTable(id: string): Promise<void> {
    return this.request(`/lead-tables/${id}`, {
      method: 'DELETE',
    });
  }

  // Conversation endpoints
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/conversations');
  }

  async createConversation(title?: string): Promise<Conversation> {
    return this.request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}`);
  }

  // Message endpoints
  async getMessages(conversationId: string): Promise<Message[]> {
    return this.request<Message[]>(`/conversations/${conversationId}/messages`);
  }

  async createMessage(
    conversationId: string,
    type: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<Message> {
    return this.request<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ type, content }),
    });
  }

  // User Profile endpoints
  async getUserProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/users/profile');
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  // ICP endpoints
  async getICPProfiles(): Promise<IdealCustomerProfile[]> {
    return this.request<IdealCustomerProfile[]>('/users/icp-profiles');
  }

  async createICPProfile(profile: Partial<IdealCustomerProfile>): Promise<IdealCustomerProfile> {
    return this.request<IdealCustomerProfile>('/users/icp-profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async updateICPProfile(id: string, profile: Partial<IdealCustomerProfile>): Promise<IdealCustomerProfile> {
    return this.request<IdealCustomerProfile>(`/users/icp-profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async deleteICPProfile(id: string): Promise<void> {
    return this.request<void>(`/users/icp-profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // Lead Signals endpoints
  async getLeadSignals(icpId?: string): Promise<LeadSignal[]> {
    const endpoint = icpId ? `/lead-signals?icp_id=${icpId}` : '/lead-signals';
    return this.request<LeadSignal[]>(endpoint);
  }

  async createLeadSignal(signal: Partial<LeadSignal>): Promise<LeadSignal> {
    return this.request<LeadSignal>('/lead-signals', {
      method: 'POST',
      body: JSON.stringify(signal),
    });
  }

  async updateLeadSignal(id: string, signal: Partial<LeadSignal>): Promise<LeadSignal> {
    return this.request<LeadSignal>(`/lead-signals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(signal),
    });
  }

  async deleteLeadSignal(id: string): Promise<void> {
    return this.request<void>(`/lead-signals/${id}`, {
      method: 'DELETE',
    });
  }

  async generateAISignals(icpId: string): Promise<LeadSignal[]> {
    return this.request<LeadSignal[]>('/signals/generate', {
      method: 'POST',
      body: JSON.stringify({ icp_id: icpId })
    });
  }

  // Website Analysis
  async analyzeWebsite(websiteUrl: string, websiteContent?: string): Promise<any> {
    return this.request('/analysis/website', {
      method: 'POST',
      body: JSON.stringify({
        website_url: websiteUrl,
        website_content: websiteContent
      })
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);