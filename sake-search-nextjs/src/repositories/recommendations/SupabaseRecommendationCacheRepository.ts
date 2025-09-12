import { supabase } from '@/lib/supabase';
import { IRecommendationCacheRepository } from './RecommendationCacheRepository';

export class SupabaseRecommendationCacheRepository implements IRecommendationCacheRepository {
  async clearByUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('recommendation_cache')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
}

