export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      app_role: "member" | "admin" | "course"
      course_config: "front" | "back" | "both"
      event_status: "locked" | "open" | "closed" | "past"
      feedback_kind: "feedback" | "issue"
      feedback_status: "new" | "in_review" | "resolved" | "wontfix"
      foursome_tier: "A" | "B" | "C"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
