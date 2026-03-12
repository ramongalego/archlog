// Generated types matching Supabase schema.
// In production, regenerate with: npx supabase gen types typescript --local > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          default_review_days: number;
          digest_opted_in: boolean;
          timezone: string;
          stripe_customer_id: string | null;
          subscription_tier: 'free' | 'pro' | 'team';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          default_review_days?: number;
          digest_opted_in?: boolean;
          timezone?: string;
          stripe_customer_id?: string | null;
          subscription_tier?: 'free' | 'pro' | 'team';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          default_review_days?: number;
          digest_opted_in?: boolean;
          timezone?: string;
          stripe_customer_id?: string | null;
          subscription_tier?: 'free' | 'pro' | 'team';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_default: boolean;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_default?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      decisions: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          why: Json | null;
          context: string | null;
          confidence: 'low' | 'medium' | 'high';
          category: 'product' | 'pricing' | 'technical' | 'hiring' | 'marketing' | 'other';
          custom_category: string | null;
          outcome_status: 'pending' | 'vindicated' | 'reversed' | 'still_playing_out';
          outcome_notes: string | null;
          outcome_recorded_at: string | null;
          outcome_due_date: string;
          review_period_days: number;
          is_archived: boolean;
          embedding: string | null;
          embedding_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          title: string;
          why?: Json | null;
          context?: string | null;
          confidence?: 'low' | 'medium' | 'high';
          category?: 'product' | 'pricing' | 'technical' | 'hiring' | 'marketing' | 'other';
          custom_category?: string | null;
          outcome_status?: 'pending' | 'vindicated' | 'reversed' | 'still_playing_out';
          outcome_notes?: string | null;
          outcome_recorded_at?: string | null;
          outcome_due_date: string;
          review_period_days?: number;
          is_archived?: boolean;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          title?: string;
          why?: Json | null;
          context?: string | null;
          confidence?: 'low' | 'medium' | 'high';
          category?: 'product' | 'pricing' | 'technical' | 'hiring' | 'marketing' | 'other';
          custom_category?: string | null;
          outcome_status?: 'pending' | 'vindicated' | 'reversed' | 'still_playing_out';
          outcome_notes?: string | null;
          outcome_recorded_at?: string | null;
          outcome_due_date?: string;
          review_period_days?: number;
          is_archived?: boolean;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      decision_edits: {
        Row: {
          id: string;
          decision_id: string;
          user_id: string;
          previous_title: string | null;
          previous_why: Json | null;
          previous_context: string | null;
          previous_confidence: 'low' | 'medium' | 'high' | null;
          previous_category:
            | 'product'
            | 'pricing'
            | 'technical'
            | 'hiring'
            | 'marketing'
            | 'other'
            | null;
          edited_at: string;
        };
        Insert: {
          id?: string;
          decision_id: string;
          user_id: string;
          previous_title?: string | null;
          previous_why?: Json | null;
          previous_context?: string | null;
          previous_confidence?: 'low' | 'medium' | 'high' | null;
          previous_category?:
            | 'product'
            | 'pricing'
            | 'technical'
            | 'hiring'
            | 'marketing'
            | 'other'
            | null;
          edited_at?: string;
        };
        Update: {
          id?: string;
          decision_id?: string;
          user_id?: string;
          previous_title?: string | null;
          previous_why?: Json | null;
          previous_context?: string | null;
          previous_confidence?: 'low' | 'medium' | 'high' | null;
          previous_category?:
            | 'product'
            | 'pricing'
            | 'technical'
            | 'hiring'
            | 'marketing'
            | 'other'
            | null;
          edited_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          status: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_price_id?: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      github_connections: {
        Row: {
          id: string;
          user_id: string;
          access_token_encrypted: string;
          github_username: string;
          selected_repo: string | null;
          last_scan_at: string | null;
          last_scan_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token_encrypted: string;
          github_username: string;
          selected_repo?: string | null;
          last_scan_at?: string | null;
          last_scan_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token_encrypted?: string;
          github_username?: string;
          selected_repo?: string | null;
          last_scan_at?: string | null;
          last_scan_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gitlab_connections: {
        Row: {
          id: string;
          user_id: string;
          access_token_encrypted: string;
          gitlab_username: string;
          selected_project: string | null;
          last_scan_at: string | null;
          last_scan_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token_encrypted: string;
          gitlab_username: string;
          selected_project?: string | null;
          last_scan_at?: string | null;
          last_scan_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token_encrypted?: string;
          gitlab_username?: string;
          selected_project?: string | null;
          last_scan_at?: string | null;
          last_scan_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notion_connections: {
        Row: {
          id: string;
          user_id: string;
          access_token_encrypted: string;
          notion_workspace_name: string;
          last_scan_at: string | null;
          last_scan_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token_encrypted: string;
          notion_workspace_name: string;
          last_scan_at?: string | null;
          last_scan_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token_encrypted?: string;
          notion_workspace_name?: string;
          last_scan_at?: string | null;
          last_scan_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      suggested_decisions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          source: string;
          github_connection_id: string | null;
          pr_url: string | null;
          pr_number: number | null;
          pr_title: string | null;
          pr_author: string | null;
          pr_body: string | null;
          extracted_title: string;
          extracted_reasoning: string;
          extracted_context: string | null;
          extracted_alternatives: string | null;
          extracted_category: string;
          confidence: string;
          status: 'pending' | 'accepted' | 'dismissed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          source: string;
          github_connection_id?: string | null;
          pr_url?: string | null;
          pr_number?: number | null;
          pr_title?: string | null;
          pr_author?: string | null;
          pr_body?: string | null;
          extracted_title: string;
          extracted_reasoning: string;
          extracted_context?: string | null;
          extracted_alternatives?: string | null;
          extracted_category?: string;
          confidence?: string;
          status?: 'pending' | 'accepted' | 'dismissed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          source?: string;
          github_connection_id?: string | null;
          pr_url?: string | null;
          pr_number?: number | null;
          pr_title?: string | null;
          pr_author?: string | null;
          pr_body?: string | null;
          extracted_title?: string;
          extracted_reasoning?: string;
          extracted_context?: string | null;
          extracted_alternatives?: string | null;
          extracted_category?: string;
          confidence?: string;
          status?: 'pending' | 'accepted' | 'dismissed';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_decisions: {
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
          p_user_id: string;
          p_project_id?: string | null;
        };
        Returns: {
          id: string;
          title: string;
          why: Json | null;
          context: string | null;
          confidence: string;
          category: string;
          outcome_status: string;
          outcome_notes: string | null;
          created_at: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      confidence_level: 'low' | 'medium' | 'high';
      decision_category: 'product' | 'pricing' | 'technical' | 'hiring' | 'marketing' | 'other';
      outcome_status: 'pending' | 'vindicated' | 'reversed' | 'still_playing_out';
      subscription_tier: 'free' | 'pro' | 'team';
      suggestion_status: 'pending' | 'accepted' | 'dismissed';
    };
    CompositeTypes: Record<string, never>;
  };
};
