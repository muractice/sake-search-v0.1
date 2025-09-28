"use server";

import type {
  RestaurantMenu,
  RestaurantMenuFormData,
  RestaurantMenuSake,
  RestaurantMenuWithSakes,
  RestaurantCreationResponse,
} from '@/types/restaurant';
import { RestaurantService } from '@/services/RestaurantService';
import { SupabaseRestaurantRepository } from '@/repositories/restaurants/SupabaseRestaurantRepository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import { getServerActionClient } from '@/lib/supabaseServerHelpers';

interface MenuSakeInput {
  sake_id: string;
  brand_id?: number | null;
  is_available?: boolean;
  menu_notes?: string | null;
}

const createRestaurantService = async () => {
  const supabase = await getServerActionClient();
  const typedClient = supabase as SupabaseClient<Database>;
  return new RestaurantService(new SupabaseRestaurantRepository(typedClient));
};

export async function loadRestaurantMenusAction(): Promise<RestaurantMenu[]> {
  const restaurantService = await createRestaurantService();
  return restaurantService.getRestaurantMenus();
}

export async function createRestaurantAction(
  input: RestaurantMenuFormData
): Promise<RestaurantCreationResponse> {
  const restaurantService = await createRestaurantService();
  return restaurantService.createRestaurant(input);
}

export async function getMenuSakesAction(menuId: string): Promise<string[]> {
  const restaurantService = await createRestaurantService();
  return restaurantService.getMenuSakes(menuId);
}

export async function addMultipleSakesToMenuAction(
  menuId: string,
  sakes: MenuSakeInput[]
): Promise<RestaurantMenuSake[]> {
  const restaurantService = await createRestaurantService();
  return restaurantService.addMultipleSakesToMenu(menuId, sakes);
}

export async function updateMenuSakesAction(
  menuId: string,
  sakes: MenuSakeInput[]
): Promise<RestaurantMenuSake[]> {
  const restaurantService = await createRestaurantService();
  return restaurantService.updateMenuSakes(menuId, sakes);
}

export async function getRestaurantWithSakesAction(
  menuId: string
): Promise<RestaurantMenuWithSakes[]> {
  const restaurantService = await createRestaurantService();
  return restaurantService.getRestaurantWithSakes(menuId);
}

export async function deleteRestaurantAction(menuId: string): Promise<void> {
  const restaurantService = await createRestaurantService();
  return restaurantService.deleteRestaurant(menuId);
}
