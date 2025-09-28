import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SupabaseRestaurantRecommendationsRepository } from '@/repositories/recommendations/SupabaseRestaurantRecommendationsRepository';
import { RestaurantRecommendationsService, RestaurantRecommendationsRequest } from '@/services/recommendations/RestaurantRecommendationsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      menuItems,
      restaurantMenuSakeData,
      dishType,
      count = 10,
    } = body as RestaurantRecommendationsRequest;

    if (!menuItems || menuItems.length === 0) {
      return NextResponse.json(
        { error: 'Menu items are required' },
        { status: 400 },
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.warn('Failed to retrieve user in restaurant recommendations route:', authError);
    }

    const repository = new SupabaseRestaurantRecommendationsRepository(supabase);
    const service = new RestaurantRecommendationsService(repository);

    const result = await service.getRecommendations({
      type,
      menuItems,
      restaurantMenuSakeData,
      dishType,
      count,
      userId: user?.id ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = mapErrorToStatus(message);

    if (status === 500) {
      console.error('Error in restaurant recommendations route:', error);
    }

    return NextResponse.json({ error: message }, { status });
  }
}

function mapErrorToStatus(message: string): number {
  switch (message) {
    case 'Menu items are required':
      return 400;
    case 'No sake data found for menu items':
    case 'メニューに日本酒がありません':
      return 404;
    default:
      return 500;
  }
}
