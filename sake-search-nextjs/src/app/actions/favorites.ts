'use server';

import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import type { SakeData } from '@/types/sake';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import { getServerActionClient } from '@/lib/supabaseServerHelpers';

function createFavoritesService(client: SupabaseClient<Database>) {
  const repo = new SupabaseFavoritesRepository(client);
  const recCacheRepo = new SupabaseRecommendationCacheRepository(client);
  return new FavoritesAppService(repo, recCacheRepo);
}

export async function addFavoriteAction(userId: string, sake: SakeData): Promise<void> {
  const supabase = await getServerActionClient();
  const client = supabase as SupabaseClient<Database>;
  const { data: { user } } = await client.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService(client);
  await service.add(userId, sake);
}

export async function removeFavoriteAction(userId: string, sakeId: string): Promise<void> {
  const supabase = await getServerActionClient();
  const client = supabase as SupabaseClient<Database>;
  const { data: { user } } = await client.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService(client);
  await service.remove(userId, sakeId);
}
