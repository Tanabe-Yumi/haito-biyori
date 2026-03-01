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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      financial_history: {
        Row: {
          cash: number | null
          code: string
          created_at: string
          dividend_per_share: number | null
          earnings_per_share: number | null
          equity_ratio: number | null
          id: string
          month: number
          operating_cash_flow: number | null
          operating_profit_margin: number | null
          payout_ratio: number | null
          sales: number | null
          year: number
        }
        Insert: {
          cash?: number | null
          code: string
          created_at?: string
          dividend_per_share?: number | null
          earnings_per_share?: number | null
          equity_ratio?: number | null
          id?: string
          month: number
          operating_cash_flow?: number | null
          operating_profit_margin?: number | null
          payout_ratio?: number | null
          sales?: number | null
          year: number
        }
        Update: {
          cash?: number | null
          code?: string
          created_at?: string
          dividend_per_share?: number | null
          earnings_per_share?: number | null
          equity_ratio?: number | null
          id?: string
          month?: number
          operating_cash_flow?: number | null
          operating_profit_margin?: number | null
          payout_ratio?: number | null
          sales?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_history_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "financial_history_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "stocks_with_scores"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "financial_history_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "stocks_with_total_score"
            referencedColumns: ["code"]
          },
        ]
      }
      industries: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      markets: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          cash: number | null
          code: string
          dividend_per_share: number | null
          earnings_per_share: number | null
          equity_ratio: number | null
          operating_cash_flow: number | null
          operating_profit_margin: number | null
          payout_ratio: number | null
          sales: number | null
          total: number | null
          updated_at: string
        }
        Insert: {
          cash?: number | null
          code: string
          dividend_per_share?: number | null
          earnings_per_share?: number | null
          equity_ratio?: number | null
          operating_cash_flow?: number | null
          operating_profit_margin?: number | null
          payout_ratio?: number | null
          sales?: number | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          cash?: number | null
          code?: string
          dividend_per_share?: number | null
          earnings_per_share?: number | null
          equity_ratio?: number | null
          operating_cash_flow?: number | null
          operating_profit_margin?: number | null
          payout_ratio?: number | null
          sales?: number | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_code_fkey"
            columns: ["code"]
            isOneToOne: true
            referencedRelation: "stocks"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scores_code_fkey"
            columns: ["code"]
            isOneToOne: true
            referencedRelation: "stocks_with_scores"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scores_code_fkey"
            columns: ["code"]
            isOneToOne: true
            referencedRelation: "stocks_with_total_score"
            referencedColumns: ["code"]
          },
        ]
      }
      stocks: {
        Row: {
          code: string
          created_at: string
          dividend_yield: number | null
          fts: unknown
          industry: number | null
          market: number | null
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          dividend_yield?: number | null
          fts?: unknown
          industry?: number | null
          market?: number | null
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          dividend_yield?: number | null
          fts?: unknown
          industry?: number | null
          market?: number | null
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_stocks_industry"
            columns: ["industry"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stocks_industry"
            columns: ["industry"]
            isOneToOne: false
            referencedRelation: "stocks_with_total_score"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "fk_stocks_market"
            columns: ["market"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stocks_market"
            columns: ["market"]
            isOneToOne: false
            referencedRelation: "stocks_with_total_score"
            referencedColumns: ["market_id"]
          },
        ]
      }
    }
    Views: {
      stocks_with_scores: {
        Row: {
          cash_score: number | null
          code: string | null
          dividend_per_share_score: number | null
          dividend_yield: number | null
          earnings_per_share_score: number | null
          equity_ratio_score: number | null
          industry: string | null
          market: string | null
          name: string | null
          operating_cash_flow_score: number | null
          operating_profit_margin_score: number | null
          payout_ratio_score: number | null
          price: number | null
          sales_score: number | null
          total_score: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      stocks_with_total_score: {
        Row: {
          code: string | null
          created_at: string | null
          dividend_yield: number | null
          fts: unknown
          industry_id: number | null
          industry_name: string | null
          market_id: number | null
          market_name: string | null
          name: string | null
          price: number | null
          total_score: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
