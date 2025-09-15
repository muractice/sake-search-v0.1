import { supabase } from '@/lib/supabase';
import { RestaurantMenu } from '@/types/restaurant';
import { IRestaurantRepository } from './RestaurantRepository';

export class SupabaseRestaurantRepository implements IRestaurantRepository {
  async listForCurrentUser(): Promise<RestaurantMenu[]> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (!auth?.user || authError) {
      throw new Error('Authentication required');
    }

    const { data: restaurants, error } = await supabase
      .from('restaurant_menus')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('registration_date', { ascending: false });

    if (error) throw error;

    // それぞれのメニューに紐づく日本酒件数を計算
    const restaurantsWithCount = await Promise.all(
      (restaurants ?? []).map(async (r) => {
        const { count, error: countError } = await supabase
          .from('restaurant_menu_sakes')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_menu_id', r.id);
        if (countError) throw countError;
        return {
          ...r,
          sake_count: count ?? 0,
        } as RestaurantMenu;
      })
    );

    return restaurantsWithCount as RestaurantMenu[];
  }
}

