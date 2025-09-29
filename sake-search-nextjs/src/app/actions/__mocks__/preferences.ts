import type { UserPreferences } from '@/types/userPreferences';

export const getPreferencesAction = jest.fn().mockResolvedValue({
  userId: 'test-user-id',
  showFavorites: true,
  updatedAt: '2024-01-01',
} as UserPreferences);

export const updateShowFavoritesAction = jest.fn().mockResolvedValue({
  userId: 'test-user-id',
  showFavorites: true,
  updatedAt: '2024-01-01',
} as UserPreferences);
