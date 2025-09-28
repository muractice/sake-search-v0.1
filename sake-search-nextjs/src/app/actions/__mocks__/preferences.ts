import type { UserPreferences } from '@/types/preferences';

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