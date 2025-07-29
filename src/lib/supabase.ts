import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
          lead_table_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          lead_table_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          lead_table_id?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          type: 'user' | 'assistant' | 'system';
          content: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          type: 'user' | 'assistant' | 'system';
          content: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          type?: 'user' | 'assistant' | 'system';
          content?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      lead_tables: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string | null;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id?: string | null;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string | null;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_rows: {
        Row: {
          id: string;
          lead_table_id: string;
          entity_type: 'company' | 'person';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_table_id: string;
          entity_type?: 'company' | 'person';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_table_id?: string;
          entity_type?: 'company' | 'person';
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_columns: {
        Row: {
          id: string;
          lead_table_id: string;
          name: string;
          column_type: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_table_id: string;
          name: string;
          column_type?: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_table_id?: string;
          name?: string;
          column_type?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      lead_cells: {
        Row: {
          id: string;
          row_id: string;
          column_id: string;
          value: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          row_id: string;
          column_id: string;
          value?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          row_id?: string;
          column_id?: string;
          value?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      ideal_customer_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          solution_products: string;
          target_region: string;
          target_customers: string;
          company_sizes: string[];
          funding_stages: string[];
          locations: string[];
          titles: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          solution_products?: string;
          target_region?: string;
          target_customers?: string;
          company_sizes?: string[];
          funding_stages?: string[];
          locations?: string[];
          titles?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          solution_products?: string;
          target_region?: string;
          target_customers?: string;
          company_sizes?: string[];
          funding_stages?: string[];
          locations?: string[];
          titles?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_signals: {
        Row: {
          id: string;
          user_id: string;
          icp_id: string;
          name: string;
          description: string | null;
          criteria: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          icp_id: string;
          name: string;
          description?: string | null;
          criteria?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          icp_id?: string;
          name?: string;
          description?: string | null;
          signal_type?: 'ai_generated' | 'custom';
          criteria?: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};