import { supabase, type Database } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { IRecommendationCacheRepository } from './RecommendationCacheRepository';

export class SupabaseRecommendationCacheRepository implements IRecommendationCacheRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.client = client ?? (supabase as SupabaseClient<Database>);
  }

  async clearByUser(userId: string): Promise<void> {
    const { error } = await this.client
      .from('recommendation_cache')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
}
