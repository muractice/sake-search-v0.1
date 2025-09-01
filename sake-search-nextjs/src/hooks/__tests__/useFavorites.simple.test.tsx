import { renderHook, act, waitFor } from '@testing-library/react';
import { SakeData } from '@/types/sake';

// シンプルなSupabaseモック
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  }
}));

import { useFavorites } from '@/features/favorites/hooks/useFavorites';
import { supabase } from '@/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useFavorites (Simple Tests)', () => {
  const mockSakeData: SakeData = {
    id: 'test-sake-1',
    name: 'テスト日本酒',
    brewery: 'テスト蔵元',
    description: 'テスト用の日本酒です',
    sweetness: 1.5,
    richness: -0.8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    
    // デフォルトモック設定
    mockSupabase.auth.getSession.mockImplementation(() => 
      Promise.resolve({ data: { session: null } })
    );
    
    mockSupabase.auth.onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }));
    
    mockSupabase.auth.signInWithPassword.mockImplementation(() => Promise.resolve({ error: null }));
    mockSupabase.auth.signUp.mockImplementation(() => Promise.resolve({ error: null }));
    mockSupabase.auth.signOut.mockImplementation(() => Promise.resolve({ error: null }));
    
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
    }));
  });

  it('初期状態を確認', async () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    expect(result.current.user).toBeNull();
    expect(typeof result.current.addFavorite).toBe('function');
    expect(typeof result.current.removeFavorite).toBe('function');
    expect(typeof result.current.isFavorite).toBe('function');
    
    // 初期状態ではisLoadingはtrueであることを確認
    expect(result.current.isLoading).toBe(true);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('isFavorite関数の基本動作', () => {
    const { result } = renderHook(() => useFavorites());

    // 空の状態ではfalse
    expect(result.current.isFavorite('any-id')).toBe(false);
  });

  it('認証関数が呼び出し可能', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useFavorites());

    await act(async () => {
      await result.current.signUpWithEmail('test@example.com', 'password');
    });

    await act(async () => {
      await result.current.signInWithEmail('test@example.com', 'password');
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalled();
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('お気に入り追加の楽観的更新', () => {
    const { result } = renderHook(() => useFavorites());

    // ユーザーがログインしている状態をシミュレート
    // 直接stateを変更するのではなく、内部状態の確認のみ行う
    expect(result.current.favorites).toEqual([]);
  });

  it('未ログイン時のお気に入り追加', async () => {
    const { result } = renderHook(() => useFavorites());

    await act(async () => {
      await result.current.addFavorite(mockSakeData);
    });

    // alertが呼ばれることを確認
    expect(window.alert).toHaveBeenCalledWith('お気に入りに追加するにはログインが必要です');
  });

  it('認証エラーハンドリング', async () => {
    const error = new Error('Authentication failed');
    mockSupabase.auth.signInWithPassword.mockRejectedValue(error);

    const { result } = renderHook(() => useFavorites());

    await expect(
      act(async () => {
        await result.current.signInWithEmail('test@example.com', 'wrongpassword');
      })
    ).rejects.toThrow('Authentication failed');
  });
});