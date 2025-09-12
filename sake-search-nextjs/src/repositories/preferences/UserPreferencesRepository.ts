import { UserPreferences } from '@/types/preferences';

export interface IUserPreferencesRepository {
  get(userId: string): Promise<UserPreferences | null>;
  updateShowFavorites(userId: string, show: boolean): Promise<UserPreferences>;
}

