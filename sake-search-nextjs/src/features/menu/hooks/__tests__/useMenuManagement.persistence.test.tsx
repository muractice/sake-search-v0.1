import { renderHook, waitFor } from '@testing-library/react';
import { useMenuManagement } from '@/features/menu/hooks/useMenuManagement';
import type { RestaurantMenu } from '@/types/restaurant';
import type { SakeData } from '@/types/sake';

const loadRestaurantMenusAction = jest.fn();
const getMenuSakesAction = jest.fn();

jest.mock('@/app/actions/restaurant', () => ({
  loadRestaurantMenusAction: (...args: unknown[]) => loadRestaurantMenusAction(...args),
  getMenuSakesAction: (...args: unknown[]) => getMenuSakesAction(...args),
  getRestaurantWithSakesAction: jest.fn(),
  updateMenuSakesAction: jest.fn(),
  addMultipleSakesToMenuAction: jest.fn(),
  createRestaurantAction: jest.fn(),
  deleteRestaurantAction: jest.fn(),
}));

jest.mock('@/features/menu/hooks/useMenuAuthState', () => ({
  useMenuAuthState: () => ({ user: { id: 'user-1' }, isAuthLoading: false }),
}));

describe('useMenuManagement', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    sessionStorage.clear();
  });

  test('restores last saved snapshot for stored menu selection', async () => {
    sessionStorage.setItem('menu:targetMenuId', 'menu-1');
    sessionStorage.setItem('menu:loadedMenuId', 'menu-1');
    sessionStorage.setItem('menu:hasUserSelected', 'true');

    const restaurants: RestaurantMenu[] = [
      {
        id: 'menu-1',
        user_id: 'user-1',
        restaurant_name: 'テスト店',
        registration_date: '2024-01-01',
        location: null,
        notes: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    loadRestaurantMenusAction.mockResolvedValue(restaurants);
    getMenuSakesAction.mockResolvedValue(['sake-1']);

    const { result } = renderHook(() => useMenuManagement());

    await waitFor(() => expect(getMenuSakesAction).toHaveBeenCalledWith('menu-1'));

    const hasChanges = result.current.hasChanges([
      { id: 'sake-1' } as SakeData,
    ]);

    expect(hasChanges).toBe(false);
  });
});
