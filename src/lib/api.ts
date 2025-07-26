import { User, Message, Lead, Conversation, UserProfile, IdealCustomerProfile, LeadSignal } from '../types';
import { supabase } from './supabase';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  // Auth endpoints - Keep these for future backend integration
  async getCurrentUser(): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    return {
      id: user.id,
      email: user.email || '',
      firstName: user.user_metadata?.firstName || 'User',
      lastName: user.user_metadata?.lastName || '',
      createdAt: new Date(user.created_at),
    };
  }

  async verifyToken(): Promise<{ valid: boolean; user_id: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    return {
      valid: !!user,
      user_id: user?.id || ''
    };
  }

  // Lead generation endpoints - Use Supabase for now
  async generateLeads(query: string, leadTableId: string) {
    // Mock implementation for now - will be replaced with backend
    return {
      message: "Generated leads successfully",
      leads: [],
      lead_table_id: leadTableId
    };
  }

  async getTableLeads(tableId: string) {
    try {
      // Get lead table
      const { data: table } = await supabase
        .from('lead_tables')
        .select('*')
        .eq('id', tableId)
        .single();

      if (!table) {
        return { leads: [], columns: [] };
      }

      // Get columns
      const { data: columns } = await supabase
        .from('lead_columns')
        .select('*')
        .eq('lead_table_id', tableId)
        .order('display_order');

      // Get rows
      const { data: rows } = await supabase
        .from('lead_rows')
        .select('*')
        .eq('lead_table_id', tableId)
        .order('created_at');

      // Get cells
      const { data: cells } = await supabase
        .from('lead_cells')
        .select('*, lead_columns(name)')
        .in('row_id', rows?.map(r => r.id) || []);

      // Organize data
      const leads = rows?.map(row => {
        const rowCells = cells?.filter(cell => cell.row_id === row.id) || [];
        const data: Record<string, any> = {};
        
        rowCells.forEach(cell => {
          if (cell.lead_columns) {
            data[cell.lead_columns.name] = cell.value;
          }
        });

        return {
          id: row.id,
          type: row.entity_type,
          name: data.Name || data.name || 'Unknown',
          data,
          createdAt: row.created_at
        };
      }) || [];

      return {
        leads,
        columns: columns?.map(col => col.name) || []
      };
    } catch (error) {
      console.error('Error getting table leads:', error);
      return { leads: [], columns: [] };
    }
  }

  // Lead Tables endpoints - Use Supabase
  async getLeadTables(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: tables } = await supabase
        .from('lead_tables')
        .select(`
          *,
          lead_rows(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      return tables?.map(table => ({
        ...table,
        lead_count: table.lead_rows?.length || 0
      })) || [];
    } catch (error) {
      console.error('Error getting lead tables:', error);
      return [];
    }
  }

  async createLeadTable(name: string, description?: string, tableType?: 'companies' | 'people' | 'custom'): Promise<any> {
    // If tableType is provided, use the new method
    if (tableType) {
      return this.createLeadTableWithType(name, description || '', tableType);
    }

    // Legacy method for backward compatibility
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: table, error } = await supabase
        .from('lead_tables')
        .insert({
          user_id: user.id,
          name,
          description
        })
        .select()
        .single();

      if (error) throw error;
      return table;
    } catch (error) {
      console.error('Error creating lead table:', error);
      throw error;
    }
  }

  async getLeadTable(id: string): Promise<any> {
    try {
      const { data: table } = await supabase
        .from('lead_tables')
        .select('*')
        .eq('id', id)
        .single();

      return table;
    } catch (error) {
      console.error('Error getting lead table:', error);
      throw error;
    }
  }

  async updateLeadTable(id: string, data: { name?: string; description?: string }): Promise<any> {
    try {
      const { data: table, error } = await supabase
        .from('lead_tables')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return table;
    } catch (error) {
      console.error('Error updating lead table:', error);
      throw error;
    }
  }

  async deleteLeadTable(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lead_tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting lead table:', error);
      throw error;
    }
  }

  // Conversation endpoints - Keep for future use
  async getConversations(): Promise<Conversation[]> {
    return [];
  }

  async createConversation(title?: string): Promise<Conversation> {
    return {
      id: '',
      messages: [],
      leads: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getConversation(id: string): Promise<Conversation> {
    return {
      id,
      messages: [],
      leads: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Message endpoints - Keep for future use
  async getMessages(conversationId: string): Promise<Message[]> {
    return [];
  }

  async createMessage(
    conversationId: string,
    type: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<Message> {
    return {
      id: '',
      type,
      content,
      timestamp: new Date()
    };
  }

  // User Profile endpoints - Use Supabase
  async getUserProfile(): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        // Create default profile
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            company_website: null,
            onboarding_completed: false
          })
          .select()
          .single();

        return newProfile;
      }

      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...profile
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // ICP endpoints - Use Supabase
  async getICPProfiles(): Promise<IdealCustomerProfile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profiles } = await supabase
        .from('ideal_customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      return profiles || [];
    } catch (error) {
      console.error('Error getting ICP profiles:', error);
      return [];
    }
  }

  async createICPProfile(profile: Partial<IdealCustomerProfile>): Promise<IdealCustomerProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: newProfile, error } = await supabase
        .from('ideal_customer_profiles')
        .insert({
          user_id: user.id,
          ...profile
        })
        .select()
        .single();

      if (error) throw error;
      return newProfile;
    } catch (error) {
      console.error('Error creating ICP profile:', error);
      throw error;
    }
  }

  async updateICPProfile(id: string, profile: Partial<IdealCustomerProfile>): Promise<IdealCustomerProfile> {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('ideal_customer_profiles')
        .update(profile)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedProfile;
    } catch (error) {
      console.error('Error updating ICP profile:', error);
      throw error;
    }
  }

  async deleteICPProfile(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ideal_customer_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting ICP profile:', error);
      throw error;
    }
  }

  // Lead Signals endpoints - Use Supabase
  async getLeadSignals(icpId?: string): Promise<LeadSignal[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('lead_signals')
        .select('*')
        .eq('user_id', user.id);

      if (icpId) {
        query = query.eq('icp_id', icpId);
      }

      const { data: signals } = await query.order('created_at', { ascending: false });
      return signals || [];
    } catch (error) {
      console.error('Error getting lead signals:', error);
      return [];
    }
  }

  async createLeadSignal(signal: Partial<LeadSignal>): Promise<LeadSignal> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: newSignal, error } = await supabase
        .from('lead_signals')
        .insert({
          user_id: user.id,
          ...signal
        })
        .select()
        .single();

      if (error) throw error;
      return newSignal;
    } catch (error) {
      console.error('Error creating lead signal:', error);
      throw error;
    }
  }

  async updateLeadSignal(id: string, signal: Partial<LeadSignal>): Promise<LeadSignal> {
    try {
      const { data: updatedSignal, error } = await supabase
        .from('lead_signals')
        .update(signal)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedSignal;
    } catch (error) {
      console.error('Error updating lead signal:', error);
      throw error;
    }
  }

  async deleteLeadSignal(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lead_signals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting lead signal:', error);
      throw error;
    }
  }

  // Mock AI endpoints for now - will be replaced with backend
  async generateAISignals(icpId: string): Promise<LeadSignal[]> {
    // Mock implementation - return empty array for now
    console.log('Mock AI signal generation for ICP:', icpId);
    return [];
  }

  // Website Analysis - Mock for now
  async analyzeWebsite(websiteUrl: string, websiteContent?: string): Promise<any> {
    // Mock implementation
    console.log('Mock website analysis for:', websiteUrl);
    return {
      company_description: "Mock company description",
      industry: "Technology",
      target_market: "B2B SaaS",
      key_products: ["Product 1", "Product 2"],
      value_proposition: "Mock value proposition",
      company_size_indicators: "Small to medium",
      technology_stack: ["React", "Node.js"],
      recent_news: ["Recent update 1", "Recent update 2"]
    };
  }
}

export const apiClient = new ApiClient();