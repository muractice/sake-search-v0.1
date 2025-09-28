import { supabase, type Database } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FavoriteItem } from '@/types/favorites';
import type { SakeData } from '@/types/sake';
import { IRestaurantRecommendationsRepository } from './RestaurantRecommendationsRepository';

export class SupabaseRestaurantRecommendationsRepository implements IRestaurantRecommendationsRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.client = client ?? (supabase as SupabaseClient<Database>);
  }

  async listFavorites(userId: string): Promise<FavoriteItem[]> {
    const { data, error } = await this.client
      .from('favorites')
      .select('sake_id,sake_data,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    type Row = Pick<Database['public']['Tables']['favorites']['Row'], 'sake_id' | 'sake_data' | 'created_at'>;
    const rows = (data ?? []) as Row[];

    return rows.map((row) => ({
      sakeId: row.sake_id,
      sakeData: row.sake_data as SakeData,
      createdAt: row.created_at,
    }));
  }
}
