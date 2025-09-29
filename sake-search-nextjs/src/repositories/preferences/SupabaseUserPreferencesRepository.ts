import { supabase, type Database } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { IUserPreferencesRepository } from './UserPreferencesRepository';
import { UserPreferences } from '@/types/userPreferences';

export class SupabaseUserPreferencesRepository implements IUserPreferencesRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.client = client ?? (supabase as SupabaseClient<Database>);
  }

  async get(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await this.client
      .from('user_preferences')
      .select('user_id,show_favorites,updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = no rows
      if ((error as { code?: string }).code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;
    type Row = Pick<Database['public']['Tables']['user_preferences']['Row'], 'user_id' | 'show_favorites' | 'updated_at'>;
    const row = data as Row;
    return {
      userId: row.user_id,
      showFavorites: !!row.show_favorites,
      updatedAt: row.updated_at,
    };
  }

  async updateShowFavorites(userId: string, show: boolean): Promise<UserPreferences> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('user_preferences')
      .upsert({
        user_id: userId,
        show_favorites: show,
        updated_at: now,
      })
      .select('user_id,show_favorites,updated_at')
      .single();

    if (error) throw error;

    type Row = Pick<Database['public']['Tables']['user_preferences']['Row'], 'user_id' | 'show_favorites' | 'updated_at'>;
    const row = data as Row;
    return {
      userId: row.user_id,
      showFavorites: !!row.show_favorites,
      updatedAt: row.updated_at,
    };
  }
}
