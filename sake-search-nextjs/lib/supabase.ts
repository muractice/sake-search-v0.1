import { createClient } from '@supabase/supabase-js'
import { SakeData } from '@/types/sake'

// クライアントサイド用のSupabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

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
          comparison_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          show_favorites?: boolean
          comparison_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          show_favorites?: boolean
          comparison_mode?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}