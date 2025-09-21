import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';
import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/SupabaseUserPreferencesRepository';
import { HomeClient } from '@/features/home/HomeClient';

export default async function Home() {
  const sb = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  const userId = user?.id ?? '';

  const service = new FavoritesAppService(
    new SupabaseFavoritesRepository(sb),
    new SupabaseRecommendationCacheRepository(sb),
    new SupabaseUserPreferencesRepository(sb),
  );

  const [items, prefs] = userId
    ? await Promise.all([service.list(userId), service.getPreferences(userId)])
    : [[], null];

  return (
    <HomeClient
      userId={userId}
      initialFavorites={items.map(i => i.sakeData)}
      initialShowFavorites={prefs?.showFavorites ?? true}
    />
  );
}
