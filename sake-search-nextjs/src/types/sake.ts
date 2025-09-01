export interface SakeData {
  id: string;
  brandId: number;
  name: string;
  brewery: string;
  breweryId: number;
  prefecture?: string; // 都道府県名
  areaId?: number; // Sake NoWaのareaId
  sweetness: number;
  richness: number;
  description: string;
  flavorChart?: FlavorChart;
}

export interface FlavorChart {
  brandId: number;
  f1: number; // 華やか (aromatic)
  f2: number; // 芳醇 (mellow)
  f3: number; // 重厚 (rich)
  f4: number; // 穏やか (mild)
  f5: number; // ドライ (dry)
  f6: number; // 軽快 (light)
}

export interface Brand {
  id: number;
  name: string;
  breweryId: number;
}

export interface Brewery {
  id: number;
  name: string;
}

export interface SearchResponse {
  success: boolean;
  results: SakeData[];
  error?: string;
}