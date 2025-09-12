import { SakeData } from '@/types/sake';

export type SakeId = string;

export interface FavoriteItem {
  sakeId: SakeId;
  sakeData: SakeData;
  createdAt?: string;
}

