export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      download_sessions: {
        Row: {
          created_at: string
          downloads_count: number | null
          expires_at: string
          id: string
          payment_id: string | null
          session_token: string
          worksheet_id: string | null
        }
        Insert: {
          created_at?: string
          downloads_count?: number | null
          expires_at?: string
          id?: string
          payment_id?: string | null
          session_token: string
          worksheet_id?: string | null
        }
        Update: {
          created_at?: string
          downloads_count?: number | null
          expires_at?: string
          id?: string
          payment_id?: string | null
          session_token?: string
          worksheet_id?: string | null
        }
        Relationships: []
      }
      export_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_identifier: string | null
          worksheet_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_identifier?: string | null
          worksheet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_identifier?: string | null
          worksheet_id?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          status: string
          user_id: string | null
          worksheet_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          status?: string
          user_id?: string | null
          worksheet_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          status?: string
          user_id?: string | null
          worksheet_id?: string
        }
        Relationships: []
      }
      processed_upgrade_sessions: {
        Row: {
          id: string
          processed_at: string
          session_id: string
          teacher_id: string
          tokens_added: number
          upgrade_details: Json | null
        }
        Insert: {
          id?: string
          processed_at?: string
          session_id: string
          teacher_id: string
          tokens_added?: number
          upgrade_details?: Json | null
        }
        Update: {
          id?: string
          processed_at?: string
          session_id?: string
          teacher_id?: string
          tokens_added?: number
          upgrade_details?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_tokens: number
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_tokens_frozen: boolean
          last_limit_reset: string | null
          last_name: string | null
          monthly_worksheet_limit: number | null
          monthly_worksheets_used: number
          rollover_tokens: number
          school_institution: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_type: string | null
          teaching_preferences: Json | null
          total_tokens_consumed: number | null
          total_tokens_received: number | null
          total_worksheets_created: number | null
          updated_at: string
        }
        Insert: {
          available_tokens?: number
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_tokens_frozen?: boolean
          last_limit_reset?: string | null
          last_name?: string | null
          monthly_worksheet_limit?: number | null
          monthly_worksheets_used?: number
          rollover_tokens?: number
          school_institution?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          teaching_preferences?: Json | null
          total_tokens_consumed?: number | null
          total_tokens_received?: number | null
          total_worksheets_created?: number | null
          updated_at?: string
        }
        Update: {
          available_tokens?: number
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_tokens_frozen?: boolean
          last_limit_reset?: string | null
          last_name?: string | null
          monthly_worksheet_limit?: number | null
          monthly_worksheets_used?: number
          rollover_tokens?: number
          school_institution?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          teaching_preferences?: Json | null
          total_tokens_consumed?: number | null
          total_tokens_received?: number | null
          total_worksheets_created?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          english_level: string
          id: string
          main_goal: string
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          english_level: string
          id?: string
          main_goal: string
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          english_level?: string
          id?: string
          main_goal?: string
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          email: string | null
          event_data: Json | null
          event_type: string
          id: string
          new_plan_type: string | null
          old_plan_type: string | null
          stripe_event_id: string | null
          teacher_id: string
          tokens_added: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          new_plan_type?: string | null
          old_plan_type?: string | null
          stripe_event_id?: string | null
          teacher_id: string
          tokens_added?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          new_plan_type?: string | null
          old_plan_type?: string | null
          stripe_event_id?: string | null
          teacher_id?: string
          tokens_added?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          email: string | null
          id: string
          monthly_limit: number
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_status: string
          subscription_type: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          email?: string | null
          id?: string
          monthly_limit: number
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_status: string
          subscription_type: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          email?: string | null
          id?: string
          monthly_limit?: number
          stripe_customer_id?: string
          stripe_subscription_id?: string
          subscription_status?: string
          subscription_type?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          teacher_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          teacher_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          teacher_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          session_id: string | null
          user_agent: string | null
          user_identifier: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_identifier: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_identifier?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worksheets: {
        Row: {
          ai_response: string
          city: string | null
          country: string | null
          created_at: string
          download_count: number
          form_data: Json
          generation_time_seconds: number | null
          html_content: string
          id: string
          ip_address: string | null
          last_modified_at: string
          prompt: string
          referrer_url: string | null
          sequence_number: number
          session_id: string | null
          status: string
          student_id: string | null
          teacher_id: string | null
          title: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          ai_response: string
          city?: string | null
          country?: string | null
          created_at?: string
          download_count?: number
          form_data: Json
          generation_time_seconds?: number | null
          html_content: string
          id?: string
          ip_address?: string | null
          last_modified_at?: string
          prompt: string
          referrer_url?: string | null
          sequence_number?: number
          session_id?: string | null
          status?: string
          student_id?: string | null
          teacher_id?: string | null
          title?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          ai_response?: string
          city?: string | null
          country?: string | null
          created_at?: string
          download_count?: number
          form_data?: Json
          generation_time_seconds?: number | null
          html_content?: string
          id?: string
          ip_address?: string | null
          last_modified_at?: string
          prompt?: string
          referrer_url?: string | null
          sequence_number?: number
          session_id?: string | null
          status?: string
          student_id?: string | null
          teacher_id?: string | null
          title?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worksheets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversion_funnel: {
        Row: {
          date: string | null
          download_attempts_locked: number | null
          download_attempts_unlocked: number | null
          form_abandons_page_leave: number | null
          form_abandons_tab_switch: number | null
          form_starts: number | null
          form_submits: number | null
          payment_button_clicks: number | null
          stripe_payments_success: number | null
          worksheet_generation_completes: number | null
          worksheet_generation_starts: number | null
          worksheet_view_ends_page_leave: number | null
          worksheet_view_ends_tab_switch: number | null
          worksheet_views: number | null
        }
        Relationships: []
      }
      popular_form_params: {
        Row: {
          avg_generation_time: number | null
          english_level: string | null
          lesson_goal: string | null
          lesson_time: string | null
          lesson_topic: string | null
          usage_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_tokens: {
        Args: {
          p_teacher_id: string
          p_amount: number
          p_description: string
          p_reference_id?: string
        }
        Returns: undefined
      }
      consume_token: {
        Args: { p_teacher_id: string; p_worksheet_id: string }
        Returns: boolean
      }
      get_token_balance: {
        Args: { p_teacher_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_worksheet_download_count: {
        Args: { p_worksheet_id: string }
        Returns: number
      }
      insert_worksheet_bypass_limit: {
        Args: {
          p_prompt: string
          p_form_data: Json
          p_ai_response: string
          p_html_content: string
          p_user_id: string
          p_ip_address: string
          p_status: string
          p_title: string
          p_generation_time_seconds: number
          p_country?: string
          p_city?: string
        }
        Returns: {
          id: string
          created_at: string
          title: string
        }[]
      }
      reactivate_user_account: {
        Args: { user_email: string }
        Returns: boolean
      }
      soft_delete_user_account: {
        Args: { user_id: string }
        Returns: boolean
      }
      track_user_event: {
        Args: {
          p_user_identifier: string
          p_event_type: string
          p_event_data?: Json
          p_ip_address?: string
          p_user_agent?: string
          p_session_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "teacher"
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
      app_role: ["admin", "teacher"],
    },
  },
} as const
