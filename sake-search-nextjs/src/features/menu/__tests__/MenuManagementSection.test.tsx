import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { MenuManagementSection } from '@/features/menu/MenuManagementSection';

describe('MenuManagementSection', () => {
  const baseState = {
    loadedMenuId: 'menu-1',
    targetMenuId: 'menu-1',
    groupedSavedMenus: {
      'menu-1': {
        restaurant_menu_id: 'menu-1',
        restaurant_name: '既存メニュー',
        location: '東京',
        registration_date: '2024-01-01',
        restaurant_created_at: '2024-01-01T00:00:00.000Z',
        count: 1,
      },
      'menu-2': {
        restaurant_menu_id: 'menu-2',
        restaurant_name: '別メニュー',
        location: '大阪',
        registration_date: '2024-02-01',
        restaurant_created_at: '2024-02-01T00:00:00.000Z',
        count: 2,
      },
    },
    menuOrMenuItemsLoading: false,
    savingToMenu: false,
    hasChanges: false,
    notification: null,
  } as const;

  const baseActions = {
    setLoadedMenuId: jest.fn(),
    setTargetMenuId: jest.fn(),
    onSaveToRestaurant: jest.fn(),
    onAddRestaurant: jest.fn(),
    onLoadSavedMenu: jest.fn().mockResolvedValue(undefined),
    onMenuItemsChange: jest.fn(),
    onDeleteRestaurant: jest.fn(),
    notify: jest.fn(),
    clearNotification: jest.fn(),
    onMenuContextReset: jest.fn(),
  };

  const originalConfirm = window.confirm;

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = originalConfirm;
  });

  test('calls onMenuContextReset when switching to another menu', async () => {
    const actions = { ...baseActions };
    window.confirm = jest.fn(() => true);
    const mockUser = { id: 'user-1' } as User;

    render(
      <MenuManagementSection
        auth={{ user: mockUser, isAuthLoading: false }}
        menuData={{ items: ['A'], sakeData: [] }}
        state={baseState}
        actions={actions}
      />
    );

    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'menu-2' } });

    await waitFor(() => {
      expect(actions.onMenuContextReset).toHaveBeenCalled();
    });
    expect(actions.onMenuItemsChange).toHaveBeenCalledWith([]);
  });
});
