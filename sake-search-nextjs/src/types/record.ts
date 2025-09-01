// 飲酒記録の型定義

export interface DrinkingRecord {
  id: string;
  userId: string;
  sakeId: string;
  sakeName: string;
  sakeBrewery?: string;
  sakePrefecture?: string; // 都道府県名
  sakeAreaId?: number; // Sake NoWaのareaId
  date: string; // YYYY-MM-DD形式
  rating: number; // 1-5
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordInput {
  sakeId: string;
  sakeName: string;
  sakeBrewery?: string;
  breweryId?: number; // 蔵元ID（breweries.id）
  date?: string; // デフォルトは今日
  rating: number;
  memo?: string;
}

export interface UpdateRecordInput {
  date?: string;
  rating?: number;
  memo?: string;
}