// 飲食店メニュー関連の型定義

export interface RestaurantMenu {
  id: string;
  user_id: string;
  restaurant_name: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantMenuSake {
  id: string;
  restaurant_menu_id: string;
  sake_id: string;
  brand_id?: number;
  is_available: boolean;
  menu_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantDrinkingRecord {
  id: string;
  user_id: string;
  restaurant_menu_id: string;
  restaurant_menu_sake_id: string;
  sake_id: string;
  brand_id?: number;
  date: string;
  rating: number;
  memo?: string;
  price_paid?: number;
  glass_ml?: number;
  created_at: string;
  updated_at: string;
}

// ビュー用の型定義
export interface RestaurantMenuWithSakes {
  restaurant_menu_id: string;
  user_id: string;
  restaurant_name: string;
  location?: string;
  restaurant_notes?: string;
  restaurant_created_at: string;
  menu_sake_id?: string;
  sake_id?: string;
  brand_id?: number;
  is_available?: boolean;
  menu_notes?: string;
  sake_added_at?: string;
  sake_name?: string;
  sake_brewery?: string;
  sweetness?: number;
  richness?: number;
}

export interface RestaurantDrinkingRecordDetail {
  record_id: string;
  user_id: string;
  date: string;
  rating: number;
  memo?: string;
  price_paid?: number;
  glass_ml?: number;
  record_created_at: string;
  restaurant_name: string;
  location?: string;
  sake_id: string;
  brand_id?: number;
  is_available: boolean;
  menu_notes?: string;
  sake_name?: string;
  sake_brewery?: string;
  sweetness?: number;
  richness?: number;
}

// フォーム用の型定義
export interface RestaurantMenuFormData {
  restaurant_name: string;
  location?: string;
  notes?: string;
}

export interface RestaurantMenuSakeFormData {
  sake_id: string;
  brand_id?: number;
  is_available: boolean;
  menu_notes?: string;
}

export interface RestaurantDrinkingRecordFormData {
  restaurant_menu_id: string;
  restaurant_menu_sake_id: string;
  sake_id: string;
  brand_id?: number;
  date: string;
  rating: number;
  memo?: string;
  price_paid?: number;
  glass_ml?: number;
}