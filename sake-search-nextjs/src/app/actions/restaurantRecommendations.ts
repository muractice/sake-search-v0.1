'use server';

import type { RestaurantRecommendationsRequest } from '@/services/recommendations/RestaurantRecommendationsService';
import { cookies } from 'next/headers';
import { RestaurantRecommendationsService } from '@/services/recommendations/RestaurantRecommendationsService';
import { getServerActionClient } from '@/lib/supabaseServerHelpers';
import { SupabaseRestaurantRecommendationsRepository } from '@/repositories/recommendations/SupabaseRestaurantRecommendationsRepository';
import type { RestaurantRecommendationsResult } from '@/types/recommendations';

export async function fetchRestaurantRecommendationsAction(
  input: Omit<RestaurantRecommendationsRequest, 'userId'>,
): Promise<RestaurantRecommendationsResult> {
  await cookies();
  const supabase = getServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  const repository = new SupabaseRestaurantRecommendationsRepository(supabase);
  const service = new RestaurantRecommendationsService(repository);

  return service.getRecommendations({
    ...input,
    userId: user?.id ?? null,
  });
}
