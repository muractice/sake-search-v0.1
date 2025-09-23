'use server';

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/SupabaseUserPreferencesRepository';
import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import type { SakeData } from '@/types/sake';

function createFavoritesService() {
  // Server Action用の認証付きクライアントを作成
  const supabase = createServerActionClient<Database>({ cookies });
  
  // 認証付きクライアントをRepositoryに渡す
  const repo = new SupabaseFavoritesRepository(supabase);
  const recCacheRepo = new SupabaseRecommendationCacheRepository(supabase);
  const prefsRepo = new SupabaseUserPreferencesRepository(supabase);
  return new FavoritesAppService(repo, recCacheRepo, prefsRepo);
}

export async function addFavoriteAction(userId: string, sake: SakeData): Promise<void> {
  // 認証状態を確認
  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService();
  await service.add(userId, sake);
}

export async function removeFavoriteAction(userId: string, sakeId: string): Promise<void> {
  // 認証状態を確認
  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService();
  await service.remove(userId, sakeId);
}

export async function updateShowFavoritesAction(userId: string, show: boolean): Promise<void> {
  // 認証状態を確認
  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }
  
  const service = createFavoritesService();
  await service.updateShowFavorites(userId, show);
}
