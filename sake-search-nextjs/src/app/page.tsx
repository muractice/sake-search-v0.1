import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { HomeClient } from '@/features/home/HomeClient';
import { SakeServiceV2 } from '@/services/SakeServiceV2';
import { SakenowaSakeRepository } from '@/repositories/sakes/SakenowaSakeRepository';
import { RestaurantService } from '@/services/RestaurantService';
import { SupabaseRestaurantRepository } from '@/repositories/restaurants/SupabaseRestaurantRepository';
import { getServerComponentClient } from '@/lib/supabaseServerHelpers';
import { getPreferencesAction } from '@/app/actions/preferences';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export default async function Home({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await getServerComponentClient();
  const client = supabase as SupabaseClient<Database>;
  const { data: { user } } = await client.auth.getUser();
  const userId = user?.id ?? '';

  const service = new FavoritesAppService(
    new SupabaseFavoritesRepository(client),
    new SupabaseRecommendationCacheRepository(client),
  );

  const [items, prefs] = userId
    ? await Promise.all([service.list(userId), getPreferencesAction(userId)])
    : [[], null];

  // RSCで検索結果を取得（qがある場合）
  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === 'string' ? sp.q : Array.isArray(sp.q) ? sp.q[0] : '';
  let initialSearchResults: import('@/types/sake').SakeData[] = [];
  let initialRestaurantMenus: import('@/types/restaurant').RestaurantMenu[] = [];
  if (q && q.trim().length > 0) {
    try {
      const searchService = new SakeServiceV2(new SakenowaSakeRepository());
      const res = await searchService.searchSakes({ query: q, limit: 20, offset: 0 });
      initialSearchResults = res.sakes;
    } catch {
      initialSearchResults = [];
    }
  }

  // レストランメニュー一覧をRSCで取得（ログイン時）
  if (userId) {
    try {
      const restaurantService = new RestaurantService(new SupabaseRestaurantRepository(client));
      initialRestaurantMenus = await restaurantService.getRestaurantMenus();
    } catch {
      initialRestaurantMenus = [];
    }
  }

  return (
    <HomeClient
      userId={userId}
      initialFavorites={items.map(i => i.sakeData)}
      initialShowFavorites={prefs?.showFavorites ?? true}
      initialQuery={q}
      initialSearchResults={initialSearchResults}
      initialRestaurantMenus={initialRestaurantMenus}
    />
  );
}
