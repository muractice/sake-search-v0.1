import { createClient } from '@supabase/supabase-js'
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
    }
  }
}