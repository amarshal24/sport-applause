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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      animator_creations: {
        Row: {
          animation_type: string
          background_type: string
          character_sport: string
          created_at: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          animation_type: string
          background_type: string
          character_sport: string
          created_at?: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          animation_type?: string
          background_type?: string
          character_sport?: string
          created_at?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      app_invites: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          invitee_email: string | null
          inviter_id: string
          status: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          invitee_email?: string | null
          inviter_id: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          invitee_email?: string | null
          inviter_id?: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          delivered_at: string | null
          id: string
          image_url: string | null
          read: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          image_url?: string | null
          read?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          image_url?: string | null
          read?: boolean
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      comparison_history: {
        Row: {
          created_at: string
          height: string
          id: string
          matches: Json
          overall_analysis: string | null
          position: string | null
          sport: string
          stats: Json | null
          user_id: string
          weight: string
        }
        Insert: {
          created_at?: string
          height: string
          id?: string
          matches: Json
          overall_analysis?: string | null
          position?: string | null
          sport: string
          stats?: Json | null
          user_id: string
          weight: string
        }
        Update: {
          created_at?: string
          height?: string
          id?: string
          matches?: Json
          overall_analysis?: string | null
          position?: string | null
          sport?: string
          stats?: Json | null
          user_id?: string
          weight?: string
        }
        Relationships: []
      }
      creator_memberships: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          creator_id: string
          current_period_end: string | null
          environment: string
          fan_id: string
          id: string
          price_cents: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          creator_id: string
          current_period_end?: string | null
          environment?: string
          fan_id: string
          id?: string
          price_cents?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          creator_id?: string
          current_period_end?: string | null
          environment?: string
          fan_id?: string
          id?: string
          price_cents?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_payouts: {
        Row: {
          created_at: string
          membership_enabled: boolean
          membership_price_cents: number
          payout_country: string | null
          payout_email: string | null
          payout_email_alerts: boolean
          payout_schedule: string
          payout_status: string
          tips_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          membership_enabled?: boolean
          membership_price_cents?: number
          payout_country?: string | null
          payout_email?: string | null
          payout_email_alerts?: boolean
          payout_schedule?: string
          payout_status?: string
          tips_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          membership_enabled?: boolean
          membership_price_cents?: number
          payout_country?: string | null
          payout_email?: string | null
          payout_email_alerts?: boolean
          payout_schedule?: string
          payout_status?: string
          tips_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          challenge_type: string
          created_at: string
          description: string
          game_id: string
          id: string
          reward_points: number
          target_score: number
        }
        Insert: {
          challenge_date?: string
          challenge_type: string
          created_at?: string
          description: string
          game_id: string
          id?: string
          reward_points?: number
          target_score: number
        }
        Update: {
          challenge_date?: string
          challenge_type?: string
          created_at?: string
          description?: string
          game_id?: string
          id?: string
          reward_points?: number
          target_score?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          accepted_at: string | null
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      fx_purchases: {
        Row: {
          created_at: string
          environment: string
          id: string
          price_id: string
          stripe_customer_id: string | null
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          environment?: string
          id?: string
          price_id: string
          stripe_customer_id?: string | null
          stripe_session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          price_id?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      game_scores: {
        Row: {
          created_at: string
          game_id: string
          id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      live_streams: {
        Row: {
          caption_vtt_url: string | null
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          replay_url: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          viewers_count: number
        }
        Insert: {
          caption_vtt_url?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          replay_url?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          viewers_count?: number
        }
        Update: {
          caption_vtt_url?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          replay_url?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          viewers_count?: number
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          category: string
          condition: string
          created_at: string
          description: string | null
          fulfillment: string
          id: string
          images: string[] | null
          league: string | null
          location: string | null
          price: number
          shipping_cost: number | null
          size: string | null
          status: string
          team: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          views_count: number
        }
        Insert: {
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          fulfillment?: string
          id?: string
          images?: string[] | null
          league?: string | null
          location?: string | null
          price: number
          shipping_cost?: number | null
          size?: string | null
          status?: string
          team?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          views_count?: number
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          fulfillment?: string
          id?: string
          images?: string[] | null
          league?: string | null
          location?: string | null
          price?: number
          shipping_cost?: number | null
          size?: string | null
          status?: string
          team?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          views_count?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          recruiting_video_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          recruiting_video_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          recruiting_video_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recruiting_video_id_fkey"
            columns: ["recruiting_video_id"]
            isOneToOne: false
            referencedRelation: "recruiting_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_matches: {
        Row: {
          created_at: string
          ended_at: string | null
          game_id: string
          guest_id: string | null
          guest_score: number | null
          host_id: string
          host_score: number | null
          id: string
          started_at: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          game_id: string
          guest_id?: string | null
          guest_score?: number | null
          host_id: string
          host_score?: number | null
          id?: string
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          game_id?: string
          guest_id?: string | null
          guest_score?: number | null
          host_id?: string
          host_score?: number | null
          id?: string
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          environment: string
          failure_reason: string | null
          id: string
          processed_at: string | null
          scheduled_for: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          failure_reason?: string | null
          id?: string
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          failure_reason?: string | null
          id?: string
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      podcast_payments: {
        Row: {
          amount_cents: number
          created_at: string
          creator_id: string
          creator_net_cents: number
          currency: string
          environment: string
          id: string
          kind: string
          payer_id: string
          platform_fee_cents: number
          podcast_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          creator_id: string
          creator_net_cents?: number
          currency?: string
          environment?: string
          id?: string
          kind: string
          payer_id: string
          platform_fee_cents?: number
          podcast_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          creator_id?: string
          creator_net_cents?: number
          currency?: string
          environment?: string
          id?: string
          kind?: string
          payer_id?: string
          platform_fee_cents?: number
          podcast_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcast_payments_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          audio_url: string
          created_at: string
          description: string | null
          duration: number | null
          id: string
          is_premium: boolean
          likes_count: number
          plays_count: number
          thumbnail_url: string | null
          tips_enabled: boolean
          title: string
          unlock_price_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_premium?: boolean
          likes_count?: number
          plays_count?: number
          thumbnail_url?: string | null
          tips_enabled?: boolean
          title: string
          unlock_price_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_premium?: boolean
          likes_count?: number
          plays_count?: number
          thumbnail_url?: string | null
          tips_enabled?: boolean
          title?: string
          unlock_price_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          music_end_time: number | null
          music_fade_in: number | null
          music_fade_out: number | null
          music_start_time: number | null
          music_title: string | null
          music_url: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          music_end_time?: number | null
          music_fade_in?: number | null
          music_fade_out?: number | null
          music_start_time?: number | null
          music_title?: string | null
          music_url?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          music_end_time?: number | null
          music_fade_in?: number | null
          music_fade_out?: number | null
          music_start_time?: number | null
          music_title?: string | null
          music_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          anime_filter_intensity: number | null
          anime_filter_preference: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          profile_video_caption: string | null
          profile_video_caption_vtt: string | null
          profile_video_url: string | null
          role: string
          sports: string[] | null
          updated_at: string
          username: string
        }
        Insert: {
          anime_filter_intensity?: number | null
          anime_filter_preference?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          profile_video_caption?: string | null
          profile_video_caption_vtt?: string | null
          profile_video_url?: string | null
          role?: string
          sports?: string[] | null
          updated_at?: string
          username: string
        }
        Update: {
          anime_filter_intensity?: number | null
          anime_filter_preference?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          profile_video_caption?: string | null
          profile_video_caption_vtt?: string | null
          profile_video_url?: string | null
          role?: string
          sports?: string[] | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      recruiter_interests: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          interest_level: number
          notes: string | null
          recruiter_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          interest_level: number
          notes?: string | null
          recruiter_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          interest_level?: number
          notes?: string | null
          recruiter_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recruiting_videos: {
        Row: {
          created_at: string
          description: string | null
          featured: boolean
          graduation_year: number | null
          height: string | null
          id: string
          location: string | null
          position: string | null
          school: string | null
          sport: string
          stats: Json | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          views_count: number
          weight: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured?: boolean
          graduation_year?: number | null
          height?: string | null
          id?: string
          location?: string | null
          position?: string | null
          school?: string | null
          sport: string
          stats?: Json | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number
          weight?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          featured?: boolean
          graduation_year?: number | null
          height?: string | null
          id?: string
          location?: string | null
          position?: string | null
          school?: string | null
          sport?: string
          stats?: Json | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alerts_enabled: boolean
          category: string | null
          created_at: string
          id: string
          last_checked_at: string
          max_price: number | null
          min_price: number | null
          name: string
          query: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          category?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string
          max_price?: number | null
          min_price?: number | null
          name: string
          query?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          category?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string
          max_price?: number | null
          min_price?: number | null
          name?: string
          query?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          image_url: string
          user_id: string
          views_count: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          image_url: string
          user_id: string
          views_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_highlights: {
        Row: {
          created_at: string
          id: string
          label: string
          stream_id: string
          timestamp_seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          stream_id: string
          timestamp_seconds: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          stream_id?: string
          timestamp_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_highlights_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      top_five_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          views_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "top_five_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          level: string
          note: string | null
          updated_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          level?: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          level?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_daily_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      video_drafts: {
        Row: {
          caption: string | null
          created_at: string
          edit_state: Json
          id: string
          updated_at: string
          user_id: string
          video_description: string | null
          video_title: string | null
          video_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          edit_state?: Json
          id?: string
          updated_at?: string
          user_id: string
          video_description?: string | null
          video_title?: string | null
          video_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          edit_state?: Json
          id?: string
          updated_at?: string
          user_id?: string
          video_description?: string | null
          video_title?: string | null
          video_url?: string
        }
        Relationships: []
      }
      watch_later: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_creator_pricing: {
        Args: { _creator_ids: string[] }
        Returns: {
          membership_enabled: boolean
          membership_price_cents: number
          tips_enabled: boolean
          user_id: string
        }[]
      }
      get_invite_by_code: {
        Args: { _invite_code: string }
        Returns: {
          created_at: string
          id: string
          invite_code: string
          inviter_id: string
          status: string
        }[]
      }
      get_trending_highlights: {
        Args: { _days?: number; _limit?: number; _sport?: string }
        Returns: {
          applause_count: number
          avatar_url: string
          comments_count: number
          content: string
          created_at: string
          full_name: string
          image_url: string
          likes_count: number
          post_id: string
          score: number
          sports: string[]
          user_id: string
          username: string
          video_url: string
          views_count: number
        }[]
      }
      has_fx_access: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_podcast_access: {
        Args: { _podcast_id: string; _user_id: string }
        Returns: boolean
      }
      is_blocked_between: { Args: { _a: string; _b: string }; Returns: boolean }
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
