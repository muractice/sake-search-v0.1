import { supabase } from '@/lib/supabase';
import {
  RestaurantMenu,
  RestaurantMenuFormData,
  RestaurantMenuSake,
  RestaurantMenuSakeFormData,
  RestaurantMenuWithSakes,
  RestaurantDrinkingRecordDetail,
  RestaurantCreationResponse,
  RestaurantCreationConflictResponse,
} from '@/types/restaurant';
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

  async createForCurrentUser(input: RestaurantMenuFormData): Promise<RestaurantCreationResponse> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (!auth?.user || authError) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('restaurant_menus')
      .insert({
        user_id: auth.user.id,
        restaurant_name: input.restaurant_name,
        registration_date: input.registration_date,
        location: input.location,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      const dbErr = error as { code?: string; message?: string };
      if (
        dbErr?.code === '23505' &&
        (dbErr?.message?.includes('restaurant_menus_user_id_restaurant_name_key') ||
          dbErr?.message?.includes('restaurant_menus_user_id_restaurant_name_registration_date_key'))
      ) {
        const conflict: RestaurantCreationConflictResponse = {
          success: true,
          conflict: true,
          message: 'この飲食店名は同じ日付で既に登録されています。別の日付を選択してください。',
        };
        return conflict;
      }
      throw error;
    }

    return data as unknown as RestaurantMenu;
  }

  async delete(menuId: string): Promise<void> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (!auth?.user || authError) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('restaurant_menus')
      .delete()
      .eq('id', menuId)
      .eq('user_id', auth.user.id);

    if (error) throw error;
  }

  async addSakeToMenu(menuId: string, input: RestaurantMenuSakeFormData): Promise<RestaurantMenuSake> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (!auth?.user || authError) {
      throw new Error('Authentication required');
    }

    const toUpsert = {
      restaurant_menu_id: menuId,
      sake_id: input.sake_id,
      brand_id: input.brand_id ?? null,
      is_available: input.is_available !== false,
      menu_notes: input.menu_notes ?? null,
    };

    const { data, error } = await supabase
      .from('restaurant_menu_sakes')
      .upsert(toUpsert, { onConflict: 'restaurant_menu_id,sake_id' })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as RestaurantMenuSake;
  }

  async getMenuSakeIds(menuId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('restaurant_menu_sakes')
      .select('sake_id')
      .eq('restaurant_menu_id', menuId);

    if (error) throw error;
    return (data ?? []).map((row) => (row as { sake_id: string }).sake_id);
  }

  async updateMenuSakes(
    menuId: string,
    sakes: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }[],
    options?: { upsert?: boolean; toDelete?: string[] }
  ): Promise<RestaurantMenuSake[]> {
    // まず削除対象があれば削除
    if (options?.toDelete && options.toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('restaurant_menu_sakes')
        .delete()
        .eq('restaurant_menu_id', menuId)
        .in('sake_id', options.toDelete);
      if (deleteError) throw deleteError;
    }

    if (!sakes || sakes.length === 0) {
      return [];
    }

    const rows = sakes.map((s) => ({
      restaurant_menu_id: menuId,
      sake_id: s.sake_id,
      brand_id: s.brand_id ?? null,
      is_available: s.is_available !== false,
      menu_notes: s.menu_notes ?? null,
    }));

    const upsert = options?.upsert !== false;
    const query = supabase.from('restaurant_menu_sakes');
    const { data, error } = upsert
      ? await query.upsert(rows, { onConflict: 'restaurant_menu_id,sake_id' }).select()
      : await query.insert(rows).select();

    if (error) throw error;
    return (data ?? []) as unknown as RestaurantMenuSake[];
  }

  async addMultipleSakesToMenu(
    menuId: string,
    sakes: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }[]
  ): Promise<RestaurantMenuSake[]> {
    const rows = sakes.map((s) => ({
      restaurant_menu_id: menuId,
      sake_id: s.sake_id,
      brand_id: s.brand_id ?? null,
      is_available: s.is_available !== false,
      menu_notes: s.menu_notes ?? null,
    }));

    const { data, error } = await supabase
      .from('restaurant_menu_sakes')
      .insert(rows)
      .select();
    if (error) throw error;
    return (data ?? []) as unknown as RestaurantMenuSake[];
  }

  async updateMenuSake(
    menuSakeId: string,
    input: Partial<RestaurantMenuSakeFormData>
  ): Promise<RestaurantMenuSake> {
    const { data, error } = await supabase
      .from('restaurant_menu_sakes')
      .update({
        brand_id: input.brand_id ?? null,
        is_available: input.is_available,
        menu_notes: input.menu_notes ?? null,
      })
      .eq('id', menuSakeId)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as RestaurantMenuSake;
  }

  async removeSakeFromMenu(menuSakeId: string): Promise<void> {
    const { error } = await supabase
      .from('restaurant_menu_sakes')
      .delete()
      .eq('id', menuSakeId);
    if (error) throw error;
  }

  async getRestaurantWithSakes(menuId: string): Promise<RestaurantMenuWithSakes[]> {
    const { data, error } = await supabase
      .from('restaurant_menu_with_sakes')
      .select('*')
      .eq('restaurant_menu_id', menuId);
    if (error) throw error;
    return (data ?? []) as unknown as RestaurantMenuWithSakes[];
  }

  async getRecentRecords(limit: number): Promise<RestaurantDrinkingRecordDetail[]> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (!auth?.user || authError) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('restaurant_drinking_records_detail')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('date', { ascending: false })
      .order('record_created_at', { ascending: false })
      .limit(limit ?? 10);
    if (error) throw error;
    return (data ?? []) as unknown as RestaurantDrinkingRecordDetail[];
  }

  async deleteRecord(recordId: string): Promise<void> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (!auth?.user || authError) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('restaurant_drinking_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', auth.user.id);
    if (error) throw error;
  }
}
