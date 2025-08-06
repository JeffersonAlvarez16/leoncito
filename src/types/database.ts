export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          role: 'user' | 'admin' | 'tipster'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          role?: 'user' | 'admin' | 'tipster'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          role?: 'user' | 'admin' | 'tipster'
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: number
          follower_id: string
          target_type: 'tipster' | 'sport' | 'league'
          target_id: string
          created_at: string
        }
        Insert: {
          id?: number
          follower_id: string
          target_type: 'tipster' | 'sport' | 'league'
          target_id: string
          created_at?: string
        }
        Update: {
          id?: number
          follower_id?: string
          target_type?: 'tipster' | 'sport' | 'league'
          target_id?: string
          created_at?: string
        }
      }
      bet_images: {
        Row: {
          id: number
          uploader_id: string | null
          storage_path: string
          status: 'queued' | 'processing' | 'failed' | 'parsed'
          ocr_confidence: number | null
          ocr_json: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          uploader_id?: string | null
          storage_path: string
          status?: 'queued' | 'processing' | 'failed' | 'parsed'
          ocr_confidence?: number | null
          ocr_json?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          uploader_id?: string | null
          storage_path?: string
          status?: 'queued' | 'processing' | 'failed' | 'parsed'
          ocr_confidence?: number | null
          ocr_json?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      bets: {
        Row: {
          id: number
          tipster_id: string | null
          title: string | null
          sport: string
          league: string | null
          starts_at: string | null
          is_premium: boolean
          price_cents: number
          status: 'draft' | 'published' | 'settled' | 'void'
          outcome: 'win' | 'lose' | 'push' | null
          yield_pct: number | null
          cover_image_path: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: number
          tipster_id?: string | null
          title?: string | null
          sport: string
          league?: string | null
          starts_at?: string | null
          is_premium?: boolean
          price_cents?: number
          status?: 'draft' | 'published' | 'settled' | 'void'
          outcome?: 'win' | 'lose' | 'push' | null
          yield_pct?: number | null
          cover_image_path?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: number
          tipster_id?: string | null
          title?: string | null
          sport?: string
          league?: string | null
          starts_at?: string | null
          is_premium?: boolean
          price_cents?: number
          status?: 'draft' | 'published' | 'settled' | 'void'
          outcome?: 'win' | 'lose' | 'push' | null
          yield_pct?: number | null
          cover_image_path?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      bet_selections: {
        Row: {
          id: number
          bet_id: number
          match_id: string | null
          home_team: string | null
          away_team: string | null
          market: string | null
          line: string | null
          odds: number | null
          stake: number | null
          bookie: string | null
          result: 'win' | 'lose' | 'push' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          bet_id: number
          match_id?: string | null
          home_team?: string | null
          away_team?: string | null
          market?: string | null
          line?: string | null
          odds?: number | null
          stake?: number | null
          bookie?: string | null
          result?: 'win' | 'lose' | 'push' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          bet_id?: number
          match_id?: string | null
          home_team?: string | null
          away_team?: string | null
          market?: string | null
          line?: string | null
          odds?: number | null
          stake?: number | null
          bookie?: string | null
          result?: 'win' | 'lose' | 'push' | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          type: 'single_pick' | 'package' | 'subscription'
          name: string
          description: string | null
          price_cents: number
          currency: string
          duration_days: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          type: 'single_pick' | 'package' | 'subscription'
          name: string
          description?: string | null
          price_cents: number
          currency?: string
          duration_days?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          type?: 'single_pick' | 'package' | 'subscription'
          name?: string
          description?: string | null
          price_cents?: number
          currency?: string
          duration_days?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_items: {
        Row: {
          id: number
          product_id: number
          bet_id: number
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          bet_id: number
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          bet_id?: number
          created_at?: string
        }
      }
      purchases: {
        Row: {
          id: number
          buyer_id: string | null
          product_id: number | null
          amount_cents: number | null
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: string | null
          admin_notes: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          buyer_id?: string | null
          product_id?: number | null
          amount_cents?: number | null
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string | null
          admin_notes?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          buyer_id?: string | null
          product_id?: number | null
          amount_cents?: number | null
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string | null
          admin_notes?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      access_grants: {
        Row: {
          id: number
          buyer_id: string
          bet_id: number
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          buyer_id: string
          bet_id: number
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          buyer_id?: string
          bet_id?: number
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      push_tokens: {
        Row: {
          id: number
          user_id: string
          provider: string
          token: string
          device_info: any | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          provider?: string
          token: string
          device_info?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          provider?: string
          token?: string
          device_info?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          type: string
          title: string
          body: string
          payload: any
          sent_to_user_id: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          type: string
          title: string
          body: string
          payload: any
          sent_to_user_id?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          type?: string
          title?: string
          body?: string
          payload?: any
          sent_to_user_id?: string | null
          sent_at?: string | null
          created_at?: string
        }
      }
    }
  }
}