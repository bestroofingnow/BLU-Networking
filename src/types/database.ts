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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          company: string | null
          role: string | null
          industry: string | null
          bio: string | null
          elevator_pitch: string | null
          profile_image_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          website_url: string | null
          location_lat: number | null
          location_lng: number | null
          location_city: string | null
          availability_status: 'available' | 'busy' | 'dnd'
          profile_completeness_score: number
          is_admin: boolean
          is_active: boolean
          subscription_status: 'pending' | 'active' | 'cancelled' | 'past_due'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          company?: string | null
          role?: string | null
          industry?: string | null
          bio?: string | null
          elevator_pitch?: string | null
          profile_image_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          website_url?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_city?: string | null
          availability_status?: 'available' | 'busy' | 'dnd'
          profile_completeness_score?: number
          is_admin?: boolean
          is_active?: boolean
          subscription_status?: 'pending' | 'active' | 'cancelled' | 'past_due'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          company?: string | null
          role?: string | null
          industry?: string | null
          bio?: string | null
          elevator_pitch?: string | null
          profile_image_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          website_url?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_city?: string | null
          availability_status?: 'available' | 'busy' | 'dnd'
          profile_completeness_score?: number
          is_admin?: boolean
          is_active?: boolean
          subscription_status?: 'pending' | 'active' | 'cancelled' | 'past_due'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_name: string
          proficiency_level: 'beginner' | 'intermediate' | 'expert' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_name: string
          proficiency_level?: 'beginner' | 'intermediate' | 'expert' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_name?: string
          proficiency_level?: 'beginner' | 'intermediate' | 'expert' | null
          created_at?: string
        }
      }
      user_goals: {
        Row: {
          id: string
          user_id: string
          goal_type: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: string
          description?: string
          created_at?: string
        }
      }
      user_offers: {
        Row: {
          id: string
          user_id: string
          offer_type: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          offer_type: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          offer_type?: string
          description?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          requester_id: string
          recipient_id: string
          status: 'pending' | 'accepted' | 'declined'
          notes: string | null
          last_interaction_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          recipient_id: string
          status?: 'pending' | 'accepted' | 'declined'
          notes?: string | null
          last_interaction_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          recipient_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          notes?: string | null
          last_interaction_at?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          type: 'direct' | 'group'
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type?: 'direct' | 'group'
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'direct' | 'group'
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'file'
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'file'
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'file'
          read_at?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          lat: number
          lng: number
          capacity: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          state: string
          lat: number
          lng: number
          capacity?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          state?: string
          lat?: number
          lng?: number
          capacity?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          location_id: string | null
          event_type: 'meeting' | 'special' | 'virtual'
          start_time: string
          end_time: string
          is_recurring: boolean
          rrule: string | null
          capacity: number | null
          virtual_link: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          location_id?: string | null
          event_type?: 'meeting' | 'special' | 'virtual'
          start_time: string
          end_time: string
          is_recurring?: boolean
          rrule?: string | null
          capacity?: number | null
          virtual_link?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          location_id?: string | null
          event_type?: 'meeting' | 'special' | 'virtual'
          start_time?: string
          end_time?: string
          is_recurring?: boolean
          rrule?: string | null
          capacity?: number | null
          virtual_link?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'registered' | 'waitlisted' | 'cancelled'
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'registered' | 'waitlisted' | 'cancelled'
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'registered' | 'waitlisted' | 'cancelled'
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string
          referred_to_id: string
          description: string | null
          outcome: 'pending' | 'successful' | 'unsuccessful' | null
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id: string
          referred_to_id: string
          description?: string | null
          outcome?: 'pending' | 'successful' | 'unsuccessful' | null
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referee_id?: string
          referred_to_id?: string
          description?: string | null
          outcome?: 'pending' | 'successful' | 'unsuccessful' | null
          created_at?: string
        }
      }
      meeting_notes: {
        Row: {
          id: string
          user_id: string
          connection_id: string
          content: string
          meeting_date: string | null
          follow_up_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          connection_id: string
          content: string
          meeting_date?: string | null
          follow_up_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          connection_id?: string
          content?: string
          meeting_date?: string | null
          follow_up_date?: string | null
          created_at?: string
        }
      }
      ai_suggestions: {
        Row: {
          id: string
          user_id: string
          suggested_user_id: string
          reason: string
          score: number
          status: 'pending' | 'accepted' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          suggested_user_id: string
          reason: string
          score: number
          status?: 'pending' | 'accepted' | 'dismissed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          suggested_user_id?: string
          reason?: string
          score?: number
          status?: 'pending' | 'accepted' | 'dismissed'
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          data: Json | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          data?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          data?: Json | null
          read_at?: string | null
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          target_audience: 'all' | 'location' | 'tier'
          target_value: string | null
          is_active: boolean
          expires_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          target_audience?: 'all' | 'location' | 'tier'
          target_value?: string | null
          is_active?: boolean
          expires_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          target_audience?: 'all' | 'location' | 'tier'
          target_value?: string | null
          is_active?: boolean
          expires_at?: string | null
          created_by?: string
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_type: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_type?: string
          earned_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          streak_type: string
          current_count: number
          best_count: number
          last_activity_at: string
        }
        Insert: {
          id?: string
          user_id: string
          streak_type: string
          current_count?: number
          best_count?: number
          last_activity_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          streak_type?: string
          current_count?: number
          best_count?: number
          last_activity_at?: string
        }
      }
      leaderboard_snapshots: {
        Row: {
          id: string
          period: 'weekly' | 'monthly' | 'all_time'
          category: string
          rankings: Json
          created_at: string
        }
        Insert: {
          id?: string
          period: 'weekly' | 'monthly' | 'all_time'
          category: string
          rankings: Json
          created_at?: string
        }
        Update: {
          id?: string
          period?: 'weekly' | 'monthly' | 'all_time'
          category?: string
          rankings?: Json
          created_at?: string
        }
      }
      user_locations: {
        Row: {
          id: string
          user_id: string
          lat: number
          lng: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lat: number
          lng: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lat?: number
          lng?: number
          updated_at?: string
        }
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
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type AISuggestion = Database['public']['Tables']['ai_suggestions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type UserBadge = Database['public']['Tables']['user_badges']['Row']
