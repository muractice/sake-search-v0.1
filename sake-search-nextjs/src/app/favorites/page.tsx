import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';
import { FavoritesAppService } from '@/services/favorites/FavoritesAppService';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/SupabaseUserPreferencesRepository';
import { FavoritesPanel } from '@/features/favorites/components/FavoritesPanel';

export default async function FavoritesPage() {
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

