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
          created_at: string
          evolution_api_instance: string | null
          evolution_api_token: string | null
          fallback_enabled: boolean
          fallback_timeout_minutes: number
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          personality: string
          restaurant_id: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          evolution_api_instance?: string | null
          evolution_api_token?: string | null
          fallback_enabled?: boolean
          fallback_timeout_minutes?: number
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          personality?: string
          restaurant_id: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          evolution_api_instance?: string | null
          evolution_api_token?: string | null
          fallback_enabled?: boolean
          fallback_timeout_minutes?: number
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          personality?: string
          restaurant_id?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "agents_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          conversation_id: string | null
          created_at: string
          event_data: Json
          event_type: string
          id: string
          order_id: string | null
          restaurant_id: string
          user_phone: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          order_id?: string | null
          restaurant_id: string
          user_phone?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          order_id?: string | null
          restaurant_id?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_sessions: {
        Row: {
          created_at: string
          delivery_address: string | null
          delivery_zone_id: string | null
          expires_at: string
          id: string
          items: Json
          notes: string | null
          payment_method_id: string | null
          restaurant_id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          delivery_zone_id?: string | null
          expires_at?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method_id?: string | null
          restaurant_id: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          delivery_zone_id?: string | null
          expires_at?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method_id?: string | null
          restaurant_id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_sessions_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_sessions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "cart_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_insights: {
        Row: {
          analysis_data: Json | null
          conversation_id: string
          converted_to_order: boolean | null
          created_at: string
          fallback_count: number | null
          id: string
          intent_detected: string | null
          key_topics: string[] | null
          resolution_time_minutes: number | null
          restaurant_id: string
          satisfaction_score: number | null
          sentiment_score: number | null
          updated_at: string
        }
        Insert: {
          analysis_data?: Json | null
          conversation_id: string
          converted_to_order?: boolean | null
          created_at?: string
          fallback_count?: number | null
          id?: string
          intent_detected?: string | null
          key_topics?: string[] | null
          resolution_time_minutes?: number | null
          restaurant_id: string
          satisfaction_score?: number | null
          sentiment_score?: number | null
          updated_at?: string
        }
        Update: {
          analysis_data?: Json | null
          conversation_id?: string
          converted_to_order?: boolean | null
          created_at?: string
          fallback_count?: number | null
          id?: string
          intent_detected?: string | null
          key_topics?: string[] | null
          resolution_time_minutes?: number | null
          restaurant_id?: string
          satisfaction_score?: number | null
          sentiment_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_insights_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_insights_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "conversation_insights_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string
          assigned_human_id: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: string
          last_message_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          assigned_human_id?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          assigned_human_id?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          delivery_addresses: Json | null
          email: string | null
          favorite_products: Json | null
          id: string
          last_order_at: string | null
          name: string
          notes: string | null
          order_count: number | null
          phone: string
          preferences: Json | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          delivery_addresses?: Json | null
          email?: string | null
          favorite_products?: Json | null
          id?: string
          last_order_at?: string | null
          name: string
          notes?: string | null
          order_count?: number | null
          phone: string
          preferences?: Json | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          delivery_addresses?: Json | null
          email?: string | null
          favorite_products?: Json | null
          id?: string
          last_order_at?: string | null
          name?: string
          notes?: string | null
          order_count?: number | null
          phone?: string
          preferences?: Json | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_integrations: {
        Row: {
          api_credentials: Json
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          menu_sync_enabled: boolean
          order_sync_enabled: boolean
          platform: string
          restaurant_id: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          api_credentials?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          menu_sync_enabled?: boolean
          order_sync_enabled?: boolean
          platform: string
          restaurant_id: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          api_credentials?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          menu_sync_enabled?: boolean
          order_sync_enabled?: boolean
          platform?: string
          restaurant_id?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_integrations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "delivery_integrations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string
          delivery_fee: number
          description: string | null
          estimated_delivery_time: number
          id: string
          is_active: boolean
          max_order_value: number | null
          min_order_value: number
          name: string
          polygon_coordinates: Json
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          description?: string | null
          estimated_delivery_time?: number
          id?: string
          is_active?: boolean
          max_order_value?: number | null
          min_order_value?: number
          name: string
          polygon_coordinates: Json
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          description?: string | null
          estimated_delivery_time?: number
          id?: string
          is_active?: boolean
          max_order_value?: number | null
          min_order_value?: number
          name?: string
          polygon_coordinates?: Json
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "delivery_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_display_settings: {
        Row: {
          auto_timer_minutes: number | null
          categories: Json
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          notification_sound: boolean
          restaurant_id: string
          station_name: string
          updated_at: string
        }
        Insert: {
          auto_timer_minutes?: number | null
          categories?: Json
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          notification_sound?: boolean
          restaurant_id: string
          station_name: string
          updated_at?: string
        }
        Update: {
          auto_timer_minutes?: number | null
          categories?: Json
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          notification_sound?: boolean
          restaurant_id?: string
          station_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_display_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "kitchen_display_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          media_url: string | null
          message_type: string
          sender_type: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          message_type?: string
          sender_type: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          message_type?: string
          sender_type?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          channel: string
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          restaurant_id: string
          template: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          restaurant_id: string
          template: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          restaurant_id?: string
          template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "notification_templates_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          data: Json
          id: string
          step_completed: number
          total_steps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data?: Json
          id?: string
          step_completed?: number
          total_steps?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data?: Json
          id?: string
          step_completed?: number
          total_steps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          previous_status: string | null
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          previous_status?: string | null
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          previous_status?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_time: string | null
          conversation_id: string | null
          coupon_code: string | null
          created_at: string
          customer_id: string
          delivery_address: string | null
          delivery_coordinates: Json | null
          delivery_fee: number
          delivery_type: string | null
          delivery_zone_id: string | null
          discount_amount: number | null
          dispatched_at: string | null
          estimated_delivery_time: string | null
          id: string
          kitchen_notes: string | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          preparation_started_at: string | null
          ready_at: string | null
          restaurant_id: string
          source_channel: string | null
          special_instructions: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery_time?: string | null
          conversation_id?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          delivery_coordinates?: Json | null
          delivery_fee?: number
          delivery_type?: string | null
          delivery_zone_id?: string | null
          discount_amount?: number | null
          dispatched_at?: string | null
          estimated_delivery_time?: string | null
          id?: string
          kitchen_notes?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          preparation_started_at?: string | null
          ready_at?: string | null
          restaurant_id: string
          source_channel?: string | null
          special_instructions?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery_time?: string | null
          conversation_id?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_coordinates?: Json | null
          delivery_fee?: number
          delivery_type?: string | null
          delivery_zone_id?: string | null
          discount_amount?: number | null
          dispatched_at?: string | null
          estimated_delivery_time?: string | null
          id?: string
          kitchen_notes?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          preparation_started_at?: string | null
          ready_at?: string | null
          restaurant_id?: string
          source_channel?: string | null
          special_instructions?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          config: Json
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          name: string
          requires_change: boolean
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          name: string
          requires_change?: boolean
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
          requires_change?: boolean
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "payment_methods_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: Json | null
          calories: number | null
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          ingredients: Json | null
          is_available: boolean
          name: string
          preparation_time: number | null
          price: number
          tags: Json | null
          updated_at: string
        }
        Insert: {
          allergens?: Json | null
          calories?: number | null
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          is_available?: boolean
          name: string
          preparation_time?: number | null
          price: number
          tags?: Json | null
          updated_at?: string
        }
        Update: {
          allergens?: Json | null
          calories?: number | null
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          is_available?: boolean
          name?: string
          preparation_time?: number | null
          price?: number
          tags?: Json | null
          updated_at?: string
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
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_classification: boolean
          analytics: boolean
          api_access: boolean
          created_at: string
          features: Json
          id: string
          max_products: number
          max_restaurants: number
          name: string
          price_monthly: number
          price_yearly: number
          type: Database["public"]["Enums"]["plan_type"]
          updated_at: string
          whatsapp_integration: boolean
        }
        Insert: {
          ai_classification?: boolean
          analytics?: boolean
          api_access?: boolean
          created_at?: string
          features?: Json
          id?: string
          max_products?: number
          max_restaurants?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          type: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
          whatsapp_integration?: boolean
        }
        Update: {
          ai_classification?: boolean
          analytics?: boolean
          api_access?: boolean
          created_at?: string
          features?: Json
          id?: string
          max_products?: number
          max_restaurants?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
          whatsapp_integration?: boolean
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversion_metrics: {
        Row: {
          avg_order_value: number | null
          conversion_rate: number | null
          restaurant_id: string | null
          restaurant_name: string | null
          total_conversations: number | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      daily_analytics: {
        Row: {
          date: string | null
          event_count: number | null
          event_type: string | null
          restaurant_id: string | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "conversion_metrics"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_carts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      refresh_analytics_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      plan_type: "free" | "basic" | "premium" | "enterprise"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
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
      plan_type: ["free", "basic", "premium", "enterprise"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
    },
  },
} as const
