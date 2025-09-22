import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';
import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/SupabaseUserPreferencesRepository';
import { HomeClient } from '@/features/home/HomeClient';
import { SakeServiceV2 } from '@/services/SakeServiceV2';
import { SakenowaSakeRepository } from '@/repositories/sakes/SakenowaSakeRepository';

export default async function Home({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
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

  // RSCで検索結果を取得（qがある場合）
  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === 'string' ? sp.q : Array.isArray(sp.q) ? sp.q[0] : '';
  let initialSearchResults: import('@/types/sake').SakeData[] = [];
  if (q && q.trim().length > 0) {
    try {
      const searchService = new SakeServiceV2(new SakenowaSakeRepository());
      const res = await searchService.searchSakes({ query: q, limit: 20, offset: 0 });
      initialSearchResults = res.sakes;
    } catch {
      initialSearchResults = [];
    }
  }

  return (
    <HomeClient
      userId={userId}
      initialFavorites={items.map(i => i.sakeData)}
      initialShowFavorites={prefs?.showFavorites ?? true}
      initialQuery={q}
      initialSearchResults={initialSearchResults}
    />
  );
}
