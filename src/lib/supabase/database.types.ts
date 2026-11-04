/**
 * Database types for the Supabase client.
 *
 * Hand-written to match `supabase/migrations`. If you change the schema you can
 * regenerate an equivalent file with:
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13';
  };
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          document_name: string;
          expiration_date: string;
          notes: string | null;
          reminder_days: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          document_type: string;
          document_name: string;
          expiration_date: string;
          notes?: string | null;
          reminder_days?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          document_name?: string;
          expiration_date?: string;
          notes?: string | null;
          reminder_days?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      delete_current_user: {
        Args: never;
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];
