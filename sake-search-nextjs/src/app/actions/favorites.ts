'use server';

import { cookies } from 'next/headers';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import type { SakeData } from '@/types/sake';
import { getServerActionClient } from '@/lib/supabaseServerHelpers';

type ServerSupabaseClient = Awaited<ReturnType<typeof getServerActionClient>>;

function createFavoritesService(supabase: ServerSupabaseClient) {
  const repo = new SupabaseFavoritesRepository(supabase);
  const recCacheRepo = new SupabaseRecommendationCacheRepository(supabase);
  return new FavoritesAppService(repo, recCacheRepo);
}

export async function addFavoriteAction(userId: string, sake: SakeData): Promise<void> {
  await cookies();
  const supabase = getServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService(supabase);
  await service.add(userId, sake);
}

export async function removeFavoriteAction(userId: string, sakeId: string): Promise<void> {
  await cookies();
  const supabase = getServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService(supabase);
  await service.remove(userId, sakeId);
}
