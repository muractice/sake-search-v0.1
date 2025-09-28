import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HomeClient } from '@/features/home/HomeClient';
import type { SakeData } from '@/types/sake';

// Mock favorites Server Actions to avoid ESM deps (jose)
jest.mock('@/app/actions/favorites', () => ({
  addFavoriteAction: jest.fn(),
  removeFavoriteAction: jest.fn(),
}));

// Mock preferences Server Actions
jest.mock('@/app/actions/preferences', () => ({
  getPreferencesAction: jest.fn(),
  updateShowFavoritesAction: jest.fn(),
}));

// Mock Server Action
const mockSearch = jest.fn();
jest.mock('@/app/actions/search', () => ({
  searchSakesAction: (...args: unknown[]) => mockSearch(...args),
}));

// Mock next/navigation router
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), prefetch: jest.fn() }),
}));

// Mock heavy comparison section to avoid deep chart imports
jest.mock('@/features/comparison/ComparisonChartSection', () => ({
  ComparisonChartSection: () => <div data-testid="comparison-section" />,
}));

// Mock FavoritesTab to avoid deep chart imports inside it
jest.mock('@/features/favorites/FavoritesTab', () => ({
  FavoritesTab: () => <div data-testid="favorites-tab" />,
}));

// Mock RecordsTab and RestaurantTab to avoid supabase client helpers
jest.mock('@/features/records/RecordsTab', () => ({
  RecordsTab: () => <div data-testid="records-tab" />,
}));
jest.mock('@/features/restaurant/RestaurantTab', () => ({
  RestaurantTab: () => <div data-testid="restaurant-tab" />,
}));

// Silence AuthProvider/Supabase side effects during render
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      refreshSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

function renderHome(initialSearchResults: SakeData[] = []) {
  return render(
    <HomeClient
      userId="u1"
      initialFavorites={[]}
      initialShowFavorites={true}
      initialSearchResults={initialSearchResults}
    />
  );
}

describe('HomeClient search via Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('成功: Server Actionの結果を表示し、URLを置換する', async () => {
    mockSearch.mockResolvedValueOnce({
      sakes: [
        { id: 's1', name: '獺祭', brewery: '旭酒造', description: '', sweetness: 1, richness: 0 } as SakeData,
        { id: 's2', name: '八海山', brewery: '八海醸造', description: '', sweetness: 0, richness: -1 } as SakeData,
      ],
      total: 2,
      query: '獺祭',
      filters: undefined,
      hasMore: false,
      timestamp: new Date().toISOString(),
    });

    renderHome([]);

    // 入力して検索
    const input = screen.getByPlaceholderText('日本酒名を入力してください（例：獺祭、八海山、伯楽星）');
    fireEvent.change(input, { target: { value: '獺祭' } });
    const submit = screen.getByRole('button', { name: /検索/ });
    fireEvent.click(submit);

    // 結果が表示される
    await screen.findByText('獺祭');
    // 候補ボタンにも同名が含まれる場合があるため、存在のみ確認
    const matches = screen.getAllByText('八海山');
    expect(matches.length).toBeGreaterThan(0);

    // URL同期（replace）が呼ばれる
    expect(mockReplace).toHaveBeenCalledWith('/?q=%E7%8D%BA%E7%A5%AD');
  });

  it('0件: ダイアログに「該当する日本酒が見つかりませんでした」を表示', async () => {
    mockSearch.mockResolvedValueOnce({
      sakes: [], total: 0, query: 'なし', filters: undefined, hasMore: false, timestamp: new Date().toISOString(),
    });

    renderHome([]);
    const input = screen.getByPlaceholderText('日本酒名を入力してください（例：獺祭、八海山、伯楽星）');
    fireEvent.change(input, { target: { value: '存在しない' } });
    const submit = screen.getByRole('button', { name: /検索/ });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText('該当する日本酒が見つかりませんでした')).toBeInTheDocument();
    });
  });

  it('失敗: ダイアログに「検索中にエラーが発生しました」を表示', async () => {
    mockSearch.mockRejectedValueOnce(new Error('network'));

    renderHome([]);
    const input = screen.getByPlaceholderText('日本酒名を入力してください（例：獺祭、八海山、伯楽星）');
    fireEvent.change(input, { target: { value: 'エラー' } });
    const submit = screen.getByRole('button', { name: /検索/ });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText('検索中にエラーが発生しました')).toBeInTheDocument();
    });
  });
});
