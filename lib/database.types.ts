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
      course_contacts: {
        Row: {
          course_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_contacts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          default_pro_shop_email: string | null
          id: string
          is_active: boolean
          league_id: string
          name: string
          notes: string | null
          short_name: string | null
          state: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          default_pro_shop_email?: string | null
          id?: string
          is_active?: boolean
          league_id: string
          name: string
          notes?: string | null
          short_name?: string | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          default_pro_shop_email?: string | null
          id?: string
          is_active?: boolean
          league_id?: string
          name?: string
          notes?: string | null
          short_name?: string | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
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
          course_id: string
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
          course_id: string
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
          course_id?: string
          created_at?: string
          date?: string
          fee_cents?: number
          id?: string
          opens_at?: string
          pro_shop_email?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      interactions: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          kind: Database["public"]["Enums"]["interaction_kind"]
          league_id: string | null
          note: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["interaction_status"]
          to_user_id: string
          value_cents: number | null
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          kind: Database["public"]["Enums"]["interaction_kind"]
          league_id?: string | null
          note?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["interaction_status"]
          to_user_id: string
          value_cents?: number | null
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["interaction_kind"]
          league_id?: string | null
          note?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["interaction_status"]
          to_user_id?: string
          value_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      league_memberships: {
        Row: {
          id: string
          joined_at: string
          league_id: string
          role: Database["public"]["Enums"]["league_member_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          league_id: string
          role?: Database["public"]["Enums"]["league_member_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          league_id?: string
          role?: Database["public"]["Enums"]["league_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_memberships_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          short_name: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          short_name?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          short_name?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          clicked_on: string
          created_at: string
          id: string
          member_link_id: string | null
          profile_id: string
          target: Database["public"]["Enums"]["link_click_target"]
          viewer_id: string | null
        }
        Insert: {
          clicked_on?: string
          created_at?: string
          id?: string
          member_link_id?: string | null
          profile_id: string
          target: Database["public"]["Enums"]["link_click_target"]
          viewer_id?: string | null
        }
        Update: {
          clicked_on?: string
          created_at?: string
          id?: string
          member_link_id?: string | null
          profile_id?: string
          target?: Database["public"]["Enums"]["link_click_target"]
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_member_link_id_fkey"
            columns: ["member_link_id"]
            isOneToOne: false
            referencedRelation: "member_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      member_links: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["member_link_kind"]
          label: string
          sort_order: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["member_link_kind"]
          label: string
          sort_order?: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["member_link_kind"]
          label?: string
          sort_order?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      profile_views: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          viewed_on: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          viewed_on?: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          viewed_on?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
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
      sponsorships: {
        Row: {
          amount_cents: number | null
          approved_by: string | null
          created_at: string
          ends_at: string | null
          id: string
          kind: Database["public"]["Enums"]["sponsorship_kind"]
          league_id: string | null
          note: string | null
          requested_at: string
          starts_at: string | null
          status: Database["public"]["Enums"]["sponsorship_status"]
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          approved_by?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["sponsorship_kind"]
          league_id?: string | null
          note?: string | null
          requested_at?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["sponsorship_status"]
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          approved_by?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["sponsorship_kind"]
          league_id?: string | null
          note?: string | null
          requested_at?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["sponsorship_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_user_id_fkey"
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
          city: string | null
          clerk_id: string | null
          company: string | null
          created_at: string
          email: string
          handicap: number | null
          helps: string[] | null
          id: string
          last_active_at: string | null
          leaderboard_opt_out: boolean
          logo_url: string | null
          name: string
          phone: string | null
          photo_url: string | null
          professional_role: string | null
          tagline: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          access_decided_at?: string | null
          access_decided_by?: string | null
          access_requested_at?: string | null
          access_status?: Database["public"]["Enums"]["access_status"]
          app_role?: Database["public"]["Enums"]["app_role"]
          bio?: string | null
          city?: string | null
          clerk_id?: string | null
          company?: string | null
          created_at?: string
          email: string
          handicap?: number | null
          helps?: string[] | null
          id?: string
          last_active_at?: string | null
          leaderboard_opt_out?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          professional_role?: string | null
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          access_decided_at?: string | null
          access_decided_by?: string | null
          access_requested_at?: string | null
          access_status?: Database["public"]["Enums"]["access_status"]
          app_role?: Database["public"]["Enums"]["app_role"]
          bio?: string | null
          city?: string | null
          clerk_id?: string | null
          company?: string | null
          created_at?: string
          email?: string
          handicap?: number | null
          helps?: string[] | null
          id?: string
          last_active_at?: string | null
          leaderboard_opt_out?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          professional_role?: string | null
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
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
      app_role: "member" | "super_admin"
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
      interaction_kind: "four" | "link" | "birdie"
      interaction_status: "pending" | "accepted" | "declined"
      league_member_role: "member" | "admin"
      link_click_target:
        | "website"
        | "social"
        | "vcard"
        | "phone"
        | "email"
        | "link_hub"
      member_link_kind:
        | "website"
        | "linkedin"
        | "instagram"
        | "facebook"
        | "x"
        | "youtube"
        | "tiktok"
        | "calendly"
        | "other"
      notification_kind:
        | "broadcast"
        | "access_request"
        | "feedback"
        | "four_received"
        | "link_request"
        | "birdie_request"
        | "interaction_accepted"
        | "interaction_declined"
        | "sponsorship_request"
        | "sponsorship_approved"
        | "sponsorship_declined"
      sponsorship_kind: "featured" | "round"
      sponsorship_status: "requested" | "active" | "declined" | "expired"
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
      app_role: ["member", "super_admin"],
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
      interaction_kind: ["four", "link", "birdie"],
      interaction_status: ["pending", "accepted", "declined"],
      league_member_role: ["member", "admin"],
      link_click_target: [
        "website",
        "social",
        "vcard",
        "phone",
        "email",
        "link_hub",
      ],
      member_link_kind: [
        "website",
        "linkedin",
        "instagram",
        "facebook",
        "x",
        "youtube",
        "tiktok",
        "calendly",
        "other",
      ],
      notification_kind: [
        "broadcast",
        "access_request",
        "feedback",
        "four_received",
        "link_request",
        "birdie_request",
        "interaction_accepted",
        "interaction_declined",
        "sponsorship_request",
        "sponsorship_approved",
        "sponsorship_declined",
      ],
      sponsorship_kind: ["featured", "round"],
      sponsorship_status: ["requested", "active", "declined", "expired"],
    },
  },
} as const
