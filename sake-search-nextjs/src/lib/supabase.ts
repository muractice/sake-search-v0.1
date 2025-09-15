import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SakeData } from '@/types/sake'

// 環境に応じたSupabase設定を使用
const isDevelopment = process.env.NODE_ENV === 'development'

// Vercelの本番環境では環境変数から、開発環境では.env.localから取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Supabase環境変数が設定されていません。${
      isDevelopment ? '.env.local' : 'Vercelの環境変数'
    }を確認してください。`
  )
}

// cookieベースの認証を使用（Next.js auth-helpers）
export const supabase: SupabaseClient<Database> = typeof window !== 'undefined' 
  ? createClientComponentClient<Database>() 
  : createClient<Database>(supabaseUrl, supabaseAnonKey)

// 型定義
export type Database = {
  public: {
    Tables: {
      restaurant_menus: {
        Row: {
          id: string
          user_id: string
          restaurant_name: string
          registration_date: string
          location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_name: string
          registration_date: string
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['restaurant_menus']['Row']>
      }
      restaurant_menu_sakes: {
        Row: {
          id: string
          restaurant_menu_id: string
          sake_id: string
          brand_id: number | null
          is_available: boolean
          menu_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_menu_id: string
          sake_id: string
          brand_id?: number | null
          is_available?: boolean
          menu_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['restaurant_menu_sakes']['Row']>
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          sake_id: string
          sake_data: SakeData
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sake_id: string
          sake_data: SakeData
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sake_id?: string
          sake_data?: SakeData
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          show_favorites: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          show_favorites?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          show_favorites?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_taste_preferences: {
        Row: {
          id: string
          user_id: string
          sweetness_preference: number
          richness_preference: number
          f1_preference: number
          f2_preference: number
          f3_preference: number
          f4_preference: number
          f5_preference: number
          f6_preference: number
          taste_type: string
          diversity_score: number
          adventure_score: number
          total_favorites: number
          calculated_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sweetness_preference?: number
          richness_preference?: number
          f1_preference?: number
          f2_preference?: number
          f3_preference?: number
          f4_preference?: number
          f5_preference?: number
          f6_preference?: number
          taste_type?: string
          diversity_score?: number
          adventure_score?: number
          total_favorites?: number
          calculated_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sweetness_preference?: number
          richness_preference?: number
          f1_preference?: number
          f2_preference?: number
          f3_preference?: number
          f4_preference?: number
          f5_preference?: number
          f6_preference?: number
          taste_type?: string
          diversity_score?: number
          adventure_score?: number
          total_favorites?: number
          calculated_at?: string
          updated_at?: string
        }
      }
      recommendation_cache: {
        Row: {
          id: string
          user_id: string
          sake_id: string
          similarity_score: number
          predicted_rating: number
          recommendation_type: string
          recommendation_reason: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sake_id: string
          similarity_score: number
          predicted_rating: number
          recommendation_type: string
          recommendation_reason?: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sake_id?: string
          similarity_score?: number
          predicted_rating?: number
          recommendation_type?: string
          recommendation_reason?: string
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: {
      restaurant_menu_with_sakes: {
        Row: {
          restaurant_menu_id: string
          user_id: string
          restaurant_name: string
          registration_date: string
          location: string | null
          restaurant_notes: string | null
          restaurant_created_at: string
          menu_sake_id: string | null
          sake_id: string | null
          brand_id: number | null
          is_available: boolean | null
          menu_notes: string | null
          sake_added_at: string | null
          sake_name: string | null
          sake_brewery: string | null
          sweetness: number | null
          richness: number | null
        }
      }
      restaurant_drinking_records_detail: {
        Row: {
          record_id: string
          user_id: string
          date: string
          rating: number
          memo: string | null
          price_paid: number | null
          glass_ml: number | null
          record_created_at: string
          restaurant_name: string
          location: string | null
          sake_id: string
          brand_id: number | null
          is_available: boolean
          menu_notes: string | null
          sake_name: string | null
          sake_brewery: string | null
          sweetness: number | null
          richness: number | null
        }
      }
    }
  }
}
