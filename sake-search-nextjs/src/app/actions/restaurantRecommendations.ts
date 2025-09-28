'use server';

import type { RestaurantRecommendationsRequest } from '@/services/recommendations/RestaurantRecommendationsService';
import { RestaurantRecommendationsService } from '@/services/recommendations/RestaurantRecommendationsService';
import { getServerActionClient } from '@/lib/supabaseServerHelpers';
import { SupabaseRestaurantRecommendationsRepository } from '@/repositories/recommendations/SupabaseRestaurantRecommendationsRepository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import type { RestaurantRecommendationsResult } from '@/types/recommendations';

export async function fetchRestaurantRecommendationsAction(
  input: Omit<RestaurantRecommendationsRequest, 'userId'>,
): Promise<RestaurantRecommendationsResult> {
  const supabase = await getServerActionClient();
  const client = supabase as SupabaseClient<Database>;
  const { data: { user } } = await client.auth.getUser();

  const repository = new SupabaseRestaurantRecommendationsRepository(client);
  const service = new RestaurantRecommendationsService(repository);

  return service.getRecommendations({
    ...input,
    userId: user?.id ?? null,
  });
}
