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
      cbt_records: {
        Row: {
          automatic_thought: string
          created_at: string
          distortions: string[] | null
          emotion: string | null
          id: string
          new_emotion: string | null
          reframed_thought: string | null
          situation: string
          user_id: string
        }
        Insert: {
          automatic_thought: string
          created_at?: string
          distortions?: string[] | null
          emotion?: string | null
          id?: string
          new_emotion?: string | null
          reframed_thought?: string | null
          situation: string
          user_id: string
        }
        Update: {
          automatic_thought?: string
          created_at?: string
          distortions?: string[] | null
          emotion?: string | null
          id?: string
          new_emotion?: string | null
          reframed_thought?: string | null
          situation?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          helpful_count: number
          id: string
          is_anonymous: boolean
          relate_count: number
          support_count: number
          tags: string[] | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_anonymous?: boolean
          relate_count?: number
          support_count?: number
          tags?: string[] | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_anonymous?: boolean
          relate_count?: number
          support_count?: number
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      counsellor_bookings: {
        Row: {
          booking_date: string
          counsellor_name: string
          counsellor_specialty: string
          created_at: string
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          booking_date: string
          counsellor_name: string
          counsellor_specialty: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          counsellor_name?: string
          counsellor_specialty?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      emotion_alchemist_sessions: {
        Row: {
          created_at: string
          generated_image_url: string | null
          id: string
          input_text: string
          reflection: string | null
          reframe: string | null
          suggestion: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_image_url?: string | null
          id?: string
          input_text: string
          reflection?: string | null
          reframe?: string | null
          suggestion?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          generated_image_url?: string | null
          id?: string
          input_text?: string
          reflection?: string | null
          reframe?: string | null
          suggestion?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          ai_reflection: string | null
          content: string
          created_at: string
          id: string
          mood: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_reflection?: string | null
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_reflection?: string | null
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meditation_sessions: {
        Row: {
          created_at: string
          cycles_completed: number
          duration_seconds: number
          id: string
          technique_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycles_completed?: number
          duration_seconds?: number
          id?: string
          technique_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycles_completed?: number
          duration_seconds?: number
          id?: string
          technique_name?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          ai_emotion: string | null
          ai_insight: string | null
          ai_intensity: string | null
          created_at: string
          id: string
          intensity: number
          mood_emoji: string
          mood_label: string
          note: string | null
          user_id: string
        }
        Insert: {
          ai_emotion?: string | null
          ai_insight?: string | null
          ai_intensity?: string | null
          created_at?: string
          id?: string
          intensity: number
          mood_emoji: string
          mood_label: string
          note?: string | null
          user_id: string
        }
        Update: {
          ai_emotion?: string | null
          ai_insight?: string | null
          ai_intensity?: string | null
          created_at?: string
          id?: string
          intensity?: number
          mood_emoji?: string
          mood_label?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      time_capsules: {
        Row: {
          capsule_type: string
          content: string | null
          created_at: string
          id: string
          is_unlocked: boolean
          media_url: string | null
          title: string
          unlock_date: string
          user_id: string
        }
        Insert: {
          capsule_type: string
          content?: string | null
          created_at?: string
          id?: string
          is_unlocked?: boolean
          media_url?: string | null
          title: string
          unlock_date: string
          user_id: string
        }
        Update: {
          capsule_type?: string
          content?: string | null
          created_at?: string
          id?: string
          is_unlocked?: boolean
          media_url?: string | null
          title?: string
          unlock_date?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
