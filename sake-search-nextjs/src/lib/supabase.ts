import { createClient } from '@supabase/supabase-js'
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
export const supabase = typeof window !== 'undefined' 
  ? createClientComponentClient() 
  : createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export type Database = {
  public: {
    Tables: {
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
  }
}