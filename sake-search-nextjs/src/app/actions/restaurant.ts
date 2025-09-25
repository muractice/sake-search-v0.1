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
import { getServerActionClient } from '@/lib/supabaseServerHelpers';

interface MenuSakeInput {
  sake_id: string;
  brand_id?: number | null;
  is_available?: boolean;
  menu_notes?: string | null;
}

const createRestaurantService = () => {
  const supabase = getServerActionClient();
  return new RestaurantService(new SupabaseRestaurantRepository(supabase));
};

export async function loadRestaurantMenusAction(): Promise<RestaurantMenu[]> {
  const restaurantService = createRestaurantService();
  return restaurantService.getRestaurantMenus();
}

export async function createRestaurantAction(
  input: RestaurantMenuFormData
): Promise<RestaurantCreationResponse> {
  const restaurantService = createRestaurantService();
  return restaurantService.createRestaurant(input);
}

export async function getMenuSakesAction(menuId: string): Promise<string[]> {
  const restaurantService = createRestaurantService();
  return restaurantService.getMenuSakes(menuId);
}

export async function addMultipleSakesToMenuAction(
  menuId: string,
  sakes: MenuSakeInput[]
): Promise<RestaurantMenuSake[]> {
  const restaurantService = createRestaurantService();
  return restaurantService.addMultipleSakesToMenu(menuId, sakes);
}

export async function updateMenuSakesAction(
  menuId: string,
  sakes: MenuSakeInput[]
): Promise<RestaurantMenuSake[]> {
  const restaurantService = createRestaurantService();
  return restaurantService.updateMenuSakes(menuId, sakes);
}

export async function getRestaurantWithSakesAction(
  menuId: string
): Promise<RestaurantMenuWithSakes[]> {
  const restaurantService = createRestaurantService();
  return restaurantService.getRestaurantWithSakes(menuId);
}

export async function deleteRestaurantAction(menuId: string): Promise<void> {
  const restaurantService = createRestaurantService();
  return restaurantService.deleteRestaurant(menuId);
}
