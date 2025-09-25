import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/SupabaseUserPreferencesRepository';
import { FavoritesPanel } from '@/features/favorites/components/FavoritesPanel';
import { getServerComponentClient } from '@/lib/supabaseServerHelpers';

export default async function FavoritesPage() {
  const sb = getServerComponentClient();
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
