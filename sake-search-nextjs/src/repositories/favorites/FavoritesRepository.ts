import { FavoriteItem } from '@/types/favorites';
import { SakeData } from '@/types/sake';

export interface IFavoritesRepository {
  list(userId: string): Promise<FavoriteItem[]>;
  add(userId: string, sake: SakeData): Promise<void>;
  remove(userId: string, sakeId: string): Promise<void>;
}
