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

// DB Row 型の最小定義（Supabase Database 型未整備テーブル分）
interface RestaurantMenusRow {
  id: string;
  user_id: string;
  restaurant_name: string;
  registration_date: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RestaurantMenuSakesRow {
  id: string;
  restaurant_menu_id: string;
  sake_id: string;
  brand_id: number | null;
  is_available: boolean;
  menu_notes: string | null;
  created_at: string;
  updated_at: string;
}

export class SupabaseRestaurantRepository implements IRestaurantRepository {
  // DB Row 型（Database 型に未定義のためローカルで厳密化）
  private mapMenu = (row: RestaurantMenusRow, sakeCount?: number): RestaurantMenu => ({
    id: row.id,
    user_id: row.user_id,
    restaurant_name: row.restaurant_name,
    registration_date: row.registration_date,
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...(typeof sakeCount === 'number' ? { sake_count: sakeCount } : {}),
  });

  async listForCurrentUser(): Promise<RestaurantMenu[]> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (!auth?.user || authError) {
      throw new Error('Authentication required');
    }

    // N+1 改善: 関連テーブルの集計を同時取得（1往復）
    // restaurant_menu_sakes(count) は FK 関係が定義されている前提
    type WithCountRow = RestaurantMenusRow & { restaurant_menu_sakes?: { count: number }[] };
    const { data, error } = await supabase
      .from('restaurant_menus')
      .select(
        'id,user_id,restaurant_name,registration_date,location,notes,created_at,updated_at,restaurant_menu_sakes(count)'
      )
      .eq('user_id', auth.user.id)
      .order('registration_date', { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as WithCountRow[];
    return rows.map((r) =>
      this.mapMenu(r, r.restaurant_menu_sakes?.[0]?.count ?? 0)
    );
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
    const row = data as RestaurantMenusRow;
    return this.mapMenu(row);
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
    const row = data as RestaurantMenuSakesRow;
    return {
      id: row.id,
      restaurant_menu_id: row.restaurant_menu_id,
      sake_id: row.sake_id,
      brand_id: row.brand_id ?? undefined,
      is_available: !!row.is_available,
      menu_notes: row.menu_notes ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } satisfies RestaurantMenuSake;
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
    const d = (data ?? []) as RestaurantMenuSakesRow[];
    return d.map((row) => ({
      id: row.id,
      restaurant_menu_id: row.restaurant_menu_id,
      sake_id: row.sake_id,
      brand_id: row.brand_id ?? undefined,
      is_available: !!row.is_available,
      menu_notes: row.menu_notes ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
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
    const row = data as RestaurantMenuSakesRow;
    return {
      id: row.id,
      restaurant_menu_id: row.restaurant_menu_id,
      sake_id: row.sake_id,
      brand_id: row.brand_id ?? undefined,
      is_available: !!row.is_available,
      menu_notes: row.menu_notes ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
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
    return (data ?? []) as RestaurantMenuWithSakes[];
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
    return (data ?? []) as RestaurantDrinkingRecordDetail[];
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
