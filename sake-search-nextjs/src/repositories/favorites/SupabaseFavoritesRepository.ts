import { supabase, type Database } from '@/lib/supabase';
import { FavoriteItem } from '@/types/favorites';
import { SakeData } from '@/types/sake';
import { IFavoritesRepository } from './FavoritesRepository';

export class SupabaseFavoritesRepository implements IFavoritesRepository {
  async list(userId: string): Promise<FavoriteItem[]> {
    const { data, error } = await supabase
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
  
  async add(userId: string, sake: SakeData): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        sake_id: sake.id,
        sake_data: sake,
      });
    if (error) throw error;
  }

  async remove(userId: string, sakeId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('sake_id', sakeId);
    if (error) throw error;
  }
}
