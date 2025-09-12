import { supabase } from '@/lib/supabase';
import { IUserPreferencesRepository } from './UserPreferencesRepository';
import { UserPreferences } from '@/types/preferences';

export class SupabaseUserPreferencesRepository implements IUserPreferencesRepository {
  async get(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = no rows
      if ((error as { code?: string }).code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;
    return {
      userId: data.user_id as string,
      showFavorites: !!data.show_favorites,
      updatedAt: data.updated_at as string,
    };
  }

  async updateShowFavorites(userId: string, show: boolean): Promise<UserPreferences> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        show_favorites: show,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      userId: data.user_id as string,
      showFavorites: !!data.show_favorites,
      updatedAt: data.updated_at as string,
    };
  }
}
