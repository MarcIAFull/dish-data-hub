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
          evolution_api_base_url: string | null
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
          evolution_api_base_url?: string | null
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
          evolution_api_base_url?: string | null
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
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_numbers: {
        Row: {
          alert_count: number | null
          blocked_at: string | null
          id: string
          phone: string
          reason: string | null
        }
        Insert: {
          alert_count?: number | null
          blocked_at?: string | null
          id?: string
          phone: string
          reason?: string | null
        }
        Update: {
          alert_count?: number | null
          blocked_at?: string | null
          id?: string
          phone?: string
          reason?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string | null
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
          emoji?: string | null
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
          emoji?: string | null
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
          restaurant_id: string | null
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
          restaurant_id?: string | null
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
          restaurant_id?: string | null
          user_id?: string | null
          user_message?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_tags: {
        Row: {
          chat_id: number
          created_at: string | null
          id: string
          tag_id: string
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          id?: string
          tag_id: string
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_tags_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "conversation_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          agent_id: string | null
          ai_enabled: boolean | null
          app: string | null
          archived_at: string | null
          conversation_id: string | null
          conversation_state: string | null
          created_at: string
          customer_id: number | null
          id: number
          last_message_at: string | null
          last_read_at: string | null
          metadata: Json | null
          phone: string | null
          reopened_at: string | null
          reopened_count: number | null
          restaurant_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_enabled?: boolean | null
          app?: string | null
          archived_at?: string | null
          conversation_id?: string | null
          conversation_state?: string | null
          created_at?: string
          customer_id?: number | null
          id?: number
          last_message_at?: string | null
          last_read_at?: string | null
          metadata?: Json | null
          phone?: string | null
          reopened_at?: string | null
          reopened_count?: number | null
          restaurant_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_enabled?: boolean | null
          app?: string | null
          archived_at?: string | null
          conversation_id?: string | null
          conversation_state?: string | null
          created_at?: string
          customer_id?: number | null
          id?: number
          last_message_at?: string | null
          last_read_at?: string | null
          metadata?: Json | null
          phone?: string | null
          reopened_at?: string | null
          reopened_count?: number | null
          restaurant_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_notes: {
        Row: {
          chat_id: number
          created_at: string | null
          id: string
          note: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          id?: string
          note: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          id?: string
          note?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_notes_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          restaurant_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          restaurant_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_tags_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_messages: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message_text: string
          message_type: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_text: string
          message_type: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_text?: string
          message_type?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
          restaurant_id: string | null
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
          restaurant_id?: string | null
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
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      delivery_zones: {
        Row: {
          created_at: string | null
          fee: number
          id: string
          is_active: boolean | null
          max_distance: number
          min_distance: number
          restaurant_id: string
        }
        Insert: {
          created_at?: string | null
          fee: number
          id?: string
          is_active?: boolean | null
          max_distance: number
          min_distance: number
          restaurant_id: string
        }
        Update: {
          created_at?: string | null
          fee?: number
          id?: string
          is_active?: boolean | null
          max_distance?: number
          min_distance?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      messages: {
        Row: {
          chat_id: number | null
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          sender_type: string
          whatsapp_message_id: string | null
        }
        Insert: {
          chat_id?: number | null
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_type: string
          whatsapp_message_id?: string | null
        }
        Update: {
          chat_id?: number | null
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_type?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          order_id: number
          previous_status: Database["public"]["Enums"]["order_status"] | null
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          order_id: number
          previous_status?: Database["public"]["Enums"]["order_status"] | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          order_id?: number
          previous_status?: Database["public"]["Enums"]["order_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          data_type: string | null
          data_value: string | null
          display_name: string
          display_order: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          method_name: string
          requires_data: boolean | null
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_type?: string | null
          data_value?: string | null
          display_name: string
          display_order?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          method_name: string
          requires_data?: boolean | null
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_type?: string | null
          data_value?: string | null
          display_name?: string
          display_order?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          method_name?: string
          requires_data?: boolean | null
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          chat_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_type: string | null
          estimated_time: number | null
          id: number
          notes: string | null
          order_source: Database["public"]["Enums"]["order_source"] | null
          order_status: Database["public"]["Enums"]["order_status"] | null
          payload: Json | null
          restaurant_id: string | null
          status: string
          status_from: string | null
          status_to: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          chat_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_type?: string | null
          estimated_time?: number | null
          id?: number
          notes?: string | null
          order_source?: Database["public"]["Enums"]["order_source"] | null
          order_status?: Database["public"]["Enums"]["order_status"] | null
          payload?: Json | null
          restaurant_id?: string | null
          status: string
          status_from?: string | null
          status_to?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          chat_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_type?: string | null
          estimated_time?: number | null
          id?: number
          notes?: string | null
          order_source?: Database["public"]["Enums"]["order_source"] | null
          order_status?: Database["public"]["Enums"]["order_status"] | null
          payload?: Json | null
          restaurant_id?: string | null
          status?: string
          status_from?: string | null
          status_to?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      product_modifiers: {
        Row: {
          applicable_categories: string[] | null
          applicable_products: string[] | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          max_quantity: number | null
          modifier_type: string
          name: string
          price: number
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          modifier_type: string
          name: string
          price?: number
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          modifier_type?: string
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_modifiers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          created_at: string | null
          id: string
          message: string
          restaurant_id: string
          shortcut: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          restaurant_id: string
          shortcut: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          restaurant_id?: string
          shortcut?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
          estimated_delivery_time: number | null
          estimated_prep_time: number | null
          id: string
          instagram: string | null
          is_active: boolean | null
          max_delivery_distance: number | null
          name: string
          packaging_fee: number | null
          phone: string | null
          slug: string
          updated_at: string | null
          user_id: string
          whatsapp: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          ai_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          estimated_delivery_time?: number | null
          estimated_prep_time?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          max_delivery_distance?: number | null
          name: string
          packaging_fee?: number | null
          phone?: string | null
          slug: string
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          ai_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          estimated_delivery_time?: number | null
          estimated_prep_time?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          max_delivery_distance?: number | null
          name?: string
          packaging_fee?: number | null
          phone?: string | null
          slug?: string
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          agent_id: string | null
          alert_type: string
          created_at: string | null
          id: string
          message_content: string | null
          patterns_detected: string[] | null
          phone: string
          request_id: string | null
        }
        Insert: {
          agent_id?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          message_content?: string | null
          patterns_detected?: string[] | null
          phone: string
          request_id?: string | null
        }
        Update: {
          agent_id?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          message_content?: string | null
          patterns_detected?: string[] | null
          phone?: string
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      conversations: {
        Row: {
          agent_id: string | null
          app: string | null
          created_at: string | null
          customer_id: number | null
          id: string | null
          phone: string | null
          restaurant_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          app?: string | null
          created_at?: string | null
          customer_id?: number | null
          id?: never
          phone?: string | null
          restaurant_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          app?: string | null
          created_at?: string | null
          customer_id?: number | null
          id?: never
          phone?: string | null
          restaurant_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          chat_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string | null
          restaurant_id: string | null
          status: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          customer_id?: never
          id?: never
          restaurant_id?: never
          status?: string | null
          total?: never
          updated_at?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          customer_id?: never
          id?: never
          restaurant_id?: never
          status?: string | null
          total?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      orders_kanban: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_type: string | null
          estimated_time: number | null
          id: number | null
          items_count: number | null
          notes: string | null
          order_source: Database["public"]["Enums"]["order_source"] | null
          order_status: Database["public"]["Enums"]["order_status"] | null
          payload: Json | null
          restaurant_id: string | null
          restaurant_name: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      match_documents:
        | {
            Args: { filter: Json; match_count: number; query_embedding: string }
            Returns: {
              content: string
              id: number
              metadata: Json
              similarity: number
            }[]
          }
        | {
            Args: {
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      order_source: "ai_agent" | "digital_menu" | "marketplace" | "manual"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "in_delivery"
        | "completed"
        | "cancelled"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      order_source: ["ai_agent", "digital_menu", "marketplace", "manual"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "in_delivery",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
