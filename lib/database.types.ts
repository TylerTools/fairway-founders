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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
      foursome_tier: "A" | "B" | "C"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
