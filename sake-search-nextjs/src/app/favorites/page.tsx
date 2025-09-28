import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { FavoritesPanel } from '@/features/favorites/components/FavoritesPanel';
import { getReadOnlyServerComponentClient } from '@/lib/supabaseServerHelpers';
import { getPreferencesAction } from '@/app/actions/preferences';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export default async function FavoritesPage() {
  const supabase = await getReadOnlyServerComponentClient();
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

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-xl font-bold mb-4">お気に入り</h1>
      <FavoritesPanel
        userId={userId}
        initialFavorites={items.map(i => i.sakeData)}
        initialShowFavorites={prefs?.showFavorites ?? true}
      />
    </div>
  );
}
