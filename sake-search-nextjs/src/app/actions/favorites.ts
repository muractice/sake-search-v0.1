'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import type { SakeData } from '@/types/sake';
import { getServerActionClient } from '@/lib/supabaseServerHelpers';

function createFavoritesService(supabase: SupabaseClient<Database>) {
  const repo = new SupabaseFavoritesRepository(supabase);
  const recCacheRepo = new SupabaseRecommendationCacheRepository(supabase);
  return new FavoritesAppService(repo, recCacheRepo);
}

export async function addFavoriteAction(userId: string, sake: SakeData): Promise<void> {
  const supabase = await getServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService(supabase);
  await service.add(userId, sake);
}

export async function removeFavoriteAction(userId: string, sakeId: string): Promise<void> {
  const supabase = await getServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService(supabase);
  await service.remove(userId, sakeId);
}
