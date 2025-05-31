export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: [
          {
            foreignKeyName: "download_sessions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "export_payments"
            referencedColumns: ["id"]
          },
        ]
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
          status: string | null
          user_id: string | null
          worksheet_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          status?: string | null
          user_id?: string | null
          worksheet_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          status?: string | null
          user_id?: string | null
          worksheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_worksheet_id_fkey"
            columns: ["worksheet_id"]
            isOneToOne: false
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
        ]
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
          sequence_number: number
          status: string
          title: string | null
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
          sequence_number?: number
          status?: string
          title?: string | null
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
          sequence_number?: number
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_worksheet_download_count: {
        Args: { p_worksheet_id: string }
        Returns: undefined
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
        }
        Returns: {
          id: string
          created_at: string
          title: string
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
