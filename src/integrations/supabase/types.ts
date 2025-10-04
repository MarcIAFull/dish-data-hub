export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string | null
          evolution_api_instance: string | null
          evolution_api_token: string | null
          fallback_enabled: boolean | null
          fallback_timeout_minutes: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          personality: string
          restaurant_id: string
          updated_at: string | null
          webhook_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          evolution_api_instance?: string | null
          evolution_api_token?: string | null
          fallback_enabled?: boolean | null
          fallback_timeout_minutes?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          personality: string
          restaurant_id: string
          updated_at?: string | null
          webhook_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          evolution_api_instance?: string | null
          evolution_api_token?: string | null
          fallback_enabled?: boolean | null
          fallback_timeout_minutes?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          personality?: string
          restaurant_id?: string
          updated_at?: string | null
          webhook_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          active: boolean | null
          app: string | null
          bot_message: string | null
          conversation_id: string | null
          created_at: string
          id: number
          message_type: string | null
          phone: string | null
          user_id: string | null
          user_message: string | null
          user_name: string | null
        }
        Insert: {
          active?: boolean | null
          app?: string | null
          bot_message?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          message_type?: string | null
          phone?: string | null
          user_id?: string | null
          user_message?: string | null
          user_name?: string | null
        }
        Update: {
          active?: boolean | null
          app?: string | null
          bot_message?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          message_type?: string | null
          phone?: string | null
          user_id?: string | null
          user_message?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          app: string | null
          conversation_id: string | null
          created_at: string
          id: number
          phone: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          app?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          app?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          active: boolean | null
          app: string | null
          cliente_name: string | null
          created_at: string
          distance: number | null
          email: string | null
          id: number
          lat: number | null
          location: string | null
          long: number | null
          pagamento: string | null
          phone: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          app?: string | null
          cliente_name?: string | null
          created_at?: string
          distance?: number | null
          email?: string | null
          id?: number
          lat?: number | null
          location?: string | null
          long?: number | null
          pagamento?: string | null
          phone?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          app?: string | null
          cliente_name?: string | null
          created_at?: string
          distance?: number | null
          email?: string | null
          id?: number
          lat?: number | null
          location?: string | null
          long?: number | null
          pagamento?: string | null
          phone?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dados_cliente: {
        Row: {
          client_name: string | null
          created_at: string | null
          id: number
          sessionid: string | null
          telefone: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          id?: number
          sessionid?: string | null
          telefone?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          id?: number
          sessionid?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          chat_id: string
          created_at: string | null
          created_by: string | null
          id: number
          payload: Json | null
          status: string
          status_from: string | null
          status_to: string | null
          updated_at: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          created_by?: string | null
          id?: number
          payload?: Json | null
          status: string
          status_from?: string | null
          status_to?: string | null
          updated_at?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: number
          payload?: Json | null
          status?: string
          status_from?: string | null
          status_to?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pedidos_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          chat_id: string
          id: number
          payload: Json | null
          status_from: string | null
          status_to: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          chat_id: string
          id?: number
          payload?: Json | null
          status_from?: string | null
          status_to?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          chat_id?: string
          id?: number
          payload?: Json | null
          status_from?: string | null
          status_to?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          ai_enabled: boolean | null
          created_at: string | null
          description: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          name: string
          phone: string | null
          slug: string
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          ai_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          ai_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args:
          | { filter: Json; match_count: number; query_embedding: string }
          | {
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
