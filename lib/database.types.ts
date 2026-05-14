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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      email_log: {
        Row: {
          audience: Database["public"]["Enums"]["email_audience"]
          blast_id: string | null
          body: string
          created_at: string
          error: string | null
          event_id: string | null
          id: string
          kind: Database["public"]["Enums"]["email_kind"]
          resend_id: string | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          to_email: string
          to_user_id: string | null
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["email_audience"]
          blast_id?: string | null
          body: string
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["email_kind"]
          resend_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          to_email: string
          to_user_id?: string | null
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["email_audience"]
          blast_id?: string | null
          body?: string
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["email_kind"]
          resend_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          to_email?: string
          to_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          closes_at: string
          course_config: Database["public"]["Enums"]["course_config"]
          created_at: string
          date: string
          fee_cents: number
          id: string
          opens_at: string
          pro_shop_email: string | null
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          closes_at: string
          course_config?: Database["public"]["Enums"]["course_config"]
          created_at?: string
          date: string
          fee_cents?: number
          id?: string
          opens_at: string
          pro_shop_email?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          closes_at?: string
          course_config?: Database["public"]["Enums"]["course_config"]
          created_at?: string
          date?: string
          fee_cents?: number
          id?: string
          opens_at?: string
          pro_shop_email?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          body: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["feedback_kind"]
          status: Database["public"]["Enums"]["feedback_status"]
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          body: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["feedback_kind"]
          status?: Database["public"]["Enums"]["feedback_status"]
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["feedback_kind"]
          status?: Database["public"]["Enums"]["feedback_status"]
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      foursome_members: {
        Row: {
          cart_number: number
          created_at: string
          foursome_id: string
          id: string
          user_id: string
        }
        Insert: {
          cart_number: number
          created_at?: string
          foursome_id: string
          id?: string
          user_id: string
        }
        Update: {
          cart_number?: number
          created_at?: string
          foursome_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foursome_members_foursome_id_fkey"
            columns: ["foursome_id"]
            isOneToOne: false
            referencedRelation: "foursomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foursome_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      foursomes: {
        Row: {
          created_at: string
          event_id: string
          group_index: number
          hole: number
          id: string
          score: number | null
          tier: Database["public"]["Enums"]["foursome_tier"]
        }
        Insert: {
          created_at?: string
          event_id: string
          group_index: number
          hole: number
          id?: string
          score?: number | null
          tier?: Database["public"]["Enums"]["foursome_tier"]
        }
        Update: {
          created_at?: string
          event_id?: string
          group_index?: number
          hole?: number
          id?: string
          score?: number | null
          tier?: Database["public"]["Enums"]["foursome_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "foursomes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      hole_scores: {
        Row: {
          created_at: string
          foursome_id: string
          hole: number
          id: string
          strokes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          foursome_id: string
          hole: number
          id?: string
          strokes: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          foursome_id?: string
          hole?: number
          id?: string
          strokes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hole_scores_foursome_id_fkey"
            columns: ["foursome_id"]
            isOneToOne: false
            referencedRelation: "foursomes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_decided_at: string | null
          access_decided_by: string | null
          access_requested_at: string | null
          access_status: Database["public"]["Enums"]["access_status"]
          app_role: Database["public"]["Enums"]["app_role"]
          bio: string | null
          clerk_id: string | null
          company: string | null
          created_at: string
          email: string
          handicap: number | null
          helps: string[] | null
          id: string
          name: string
          professional_role: string | null
          updated_at: string
        }
        Insert: {
          access_decided_at?: string | null
          access_decided_by?: string | null
          access_requested_at?: string | null
          access_status?: Database["public"]["Enums"]["access_status"]
          app_role?: Database["public"]["Enums"]["app_role"]
          bio?: string | null
          clerk_id?: string | null
          company?: string | null
          created_at?: string
          email: string
          handicap?: number | null
          helps?: string[] | null
          id?: string
          name: string
          professional_role?: string | null
          updated_at?: string
        }
        Update: {
          access_decided_at?: string | null
          access_decided_by?: string | null
          access_requested_at?: string | null
          access_status?: Database["public"]["Enums"]["access_status"]
          app_role?: Database["public"]["Enums"]["app_role"]
          bio?: string | null
          clerk_id?: string | null
          company?: string | null
          created_at?: string
          email?: string
          handicap?: number | null
          helps?: string[] | null
          id?: string
          name?: string
          professional_role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_access_decided_by_fkey"
            columns: ["access_decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      access_status: "pending" | "approved" | "denied"
      app_role: "member" | "admin" | "course"
      course_config: "front" | "back" | "both"
      email_audience:
        | "one"
        | "all_approved"
        | "this_week_rsvps"
        | "this_week_no_rsvps"
        | "pending_applicants"
        | "all_admins"
      email_kind:
        | "access_approved"
        | "access_denied"
        | "foursomes_generated"
        | "rsvp_reminder"
        | "pro_shop_confirmation"
        | "admin_blast"
      email_status: "queued" | "sent" | "failed" | "cancelled"
      event_status: "locked" | "open" | "closed" | "past"
      feedback_kind: "feedback" | "issue"
      feedback_status: "new" | "in_review" | "resolved" | "wontfix"
      foursome_tier: "A" | "B" | "C"
      notification_kind: "broadcast" | "access_request" | "feedback"
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
      access_status: ["pending", "approved", "denied"],
      app_role: ["member", "admin", "course"],
      course_config: ["front", "back", "both"],
      email_audience: [
        "one",
        "all_approved",
        "this_week_rsvps",
        "this_week_no_rsvps",
        "pending_applicants",
        "all_admins",
      ],
      email_kind: [
        "access_approved",
        "access_denied",
        "foursomes_generated",
        "rsvp_reminder",
        "pro_shop_confirmation",
        "admin_blast",
      ],
      email_status: ["queued", "sent", "failed", "cancelled"],
      event_status: ["locked", "open", "closed", "past"],
      feedback_kind: ["feedback", "issue"],
      feedback_status: ["new", "in_review", "resolved", "wontfix"],
      foursome_tier: ["A", "B", "C"],
      notification_kind: ["broadcast", "access_request", "feedback"],
    },
  },
} as const
