import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FavoritesProvider, useFavoritesContext } from '@/features/favorites/contexts/FavoritesContext';
import { AuthProvider } from '@/features/auth/contexts/AuthContext';
import type { SakeData } from '@/types/sake';

// Server Actionsは本テストでは呼ばれないが、念のためモック
jest.mock('@/app/actions/favorites', () => ({
  addFavoriteAction: jest.fn().mockResolvedValue(undefined),
  removeFavoriteAction: jest.fn().mockResolvedValue(undefined),
  updateShowFavoritesAction: jest.fn().mockResolvedValue(undefined),
}));

// Supabaseクライアントをモック（AuthProvider/Repositories双方で使用）
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const Consumer = () => {
  const ctx = useFavoritesContext();
  return (
    <div>
      <div data-testid="count">{ctx.favorites.length}</div>
      <div data-testid="show">{ctx.showFavorites ? 'true' : 'false'}</div>
      <div data-testid="loading">{ctx.isLoading ? 'true' : 'false'}</div>
      <div data-testid="user">{ctx.user?.id ?? ''}</div>
    </div>
  );
};

describe('FavoritesProvider SSR initial values', () => {
  const s1: SakeData = { id: 's1', name: '一番', brewery: '蔵1', description: '', sweetness: 0.1, richness: -0.2 };
  const s2: SakeData = { id: 's2', name: '二番', brewery: '蔵2', description: '', sweetness: -0.1, richness: 0.8 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.onAuthStateChange.mockImplementation(
      () => ({ data: { subscription: { unsubscribe: jest.fn() } } }) as unknown as { data: { subscription: { unsubscribe: () => void } } }
    );
  });

  it('初期favorites/表示を即時に反映し、認証後に同期する（ログイン時）', async () => {
    // Auth: ログイン済みu1を返す
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1', email: 't@example.com' } } } } as unknown as { data: { session: { user: { id: string; email: string } } } });
    mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: { user: { id: 'u1', email: 't@example.com' } } } } as unknown as { data: { session: { user: { id: string; email: string } } } });

    // Repositories: favoritesは1件、prefsはfalseを返す
    mockSupabase.from.mockImplementation((table: string): unknown => {
      if (table === 'favorites') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [ { user_id: 'u1', sake_id: s1.id, sake_data: s1, created_at: '2024-01-01' } ],
            error: null,
          }),
        } as unknown as Record<string, unknown>;
      }
      if (table === 'user_preferences') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'u1', show_favorites: false, updated_at: '2024-01-01' },
            error: null,
          }),
        } as unknown as Record<string, unknown>;
      }
      return {} as unknown as Record<string, unknown>;
    });

    render(
      <AuthProvider>
        <FavoritesProvider initialFavorites={[s1, s2]} initialShowFavorites={true} initialUserId="u1">
          <Consumer />
        </FavoritesProvider>
      </AuthProvider>
    );

    // 初期描画ではSSR初期値がそのまま反映
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('show').textContent).toBe('true');

    // 同期完了後はRepositoryの結果に置き換わる
    // ユーザーが反映され、favorites/prefsが同期されるのを待つ
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u1'));
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    await waitFor(() => expect(screen.getByTestId('show').textContent).toBe('false'));
  });

  it('未ログインの場合、favoritesは空になり、showFavoritesは初期値を維持', async () => {
    // Auth: 未ログイン
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } } as unknown as { data: { session: null } });
    mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: null } } as unknown as { data: { session: null } });

    render(
      <AuthProvider>
        <FavoritesProvider initialFavorites={[s1, s2]} initialShowFavorites={false} initialUserId="uX">
          <Consumer />
        </FavoritesProvider>
      </AuthProvider>
    );

    // 初期描画ではSSR初期値
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('show').textContent).toBe('false');

    // 認証解決後、favoritesはクリア・showFavoritesは維持
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));
    await waitFor(() => expect(screen.getByTestId('show').textContent).toBe('false'));
  });
});
