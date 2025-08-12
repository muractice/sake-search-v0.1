import { renderHook, act } from '@testing-library/react';
import { SakeData } from '@/types/sake';

// Supabaseクライアントをモック
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

import { useFavorites } from '../useFavorites';
import { supabase } from '@/lib/supabase';

// モックされたSupabaseクライアントを取得
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useFavorites', () => {
  const mockSakeData: SakeData = {
    id: 'test-sake-1',
    name: 'テスト日本酒',
    brewery: 'テスト蔵元',
    description: 'テスト用の日本酒です',
    sweetness: 1.5,
    richness: -0.8,
    flavorChart: {
      f1: 0.6,
      f2: 0.4,
      f3: 0.2,
      f4: 0.8,
      f5: 0.3,
      f6: 0.7
    }
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // window.alertのモック
    window.alert = jest.fn();
    
    // デフォルトのモック設定
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null }
    });
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
  });

  it('初期状態が正しく設定される', async () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.showFavorites).toBe(true);
    expect(result.current.comparisonMode).toBe(true);
  });

  describe('お気に入り機能', () => {
    beforeEach(() => {
      // ユーザーがログインしている状態をモック
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser 
          } 
        }
      });

      // データベース操作のモック
      const mockSelect = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        delete: mockDelete,
        eq: mockEq,
        order: mockOrder,
        single: mockSingle,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        order: mockOrder,
        single: mockSingle,
      });

      mockInsert.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockResolvedValue({ error: null });
    });

    it('お気に入りに追加できる', async () => {
      const { result } = renderHook(() => useFavorites());

      // ログイン状態にする
      act(() => {
        result.current.user = mockUser as any;
      });

      await act(async () => {
        await result.current.addFavorite(mockSakeData);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('favorites');
      expect(result.current.favorites).toContain(mockSakeData);
    });

    it('重複したお気に入りは追加されない', async () => {
      const { result } = renderHook(() => useFavorites());

      // 既にお気に入りに存在する状態を作る
      act(() => {
        result.current.user = mockUser as any;
      });

      // 最初の追加
      await act(async () => {
        await result.current.addFavorite(mockSakeData);
      });

      const initialLength = result.current.favorites.length;

      // 同じアイテムを再度追加
      await act(async () => {
        await result.current.addFavorite(mockSakeData);
      });

      // 長さが変わらないことを確認
      expect(result.current.favorites).toHaveLength(initialLength);
    });

    it('お気に入りから削除できる', async () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.user = mockUser as any;
      });

      // 先にお気に入りに追加
      await act(async () => {
        await result.current.addFavorite(mockSakeData);
      });

      expect(result.current.favorites).toContain(mockSakeData);

      // 削除
      await act(async () => {
        await result.current.removeFavorite(mockSakeData.id);
      });

      expect(result.current.favorites).not.toContain(mockSakeData);
    });

    it('isFavorite関数が正しく動作する', async () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.user = mockUser as any;
      });

      // 最初は false
      expect(result.current.isFavorite(mockSakeData.id)).toBe(false);

      // 追加後は true
      await act(async () => {
        await result.current.addFavorite(mockSakeData);
      });

      expect(result.current.isFavorite(mockSakeData.id)).toBe(true);

      // 削除後は false
      await act(async () => {
        await result.current.removeFavorite(mockSakeData.id);
      });

      expect(result.current.isFavorite(mockSakeData.id)).toBe(false);
    });
  });

  describe('認証機能', () => {
    it('メールでサインアップできる', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.signUpWithEmail('test@example.com', 'password123');
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('メールでサインインできる', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.signInWithEmail('test@example.com', 'password123');
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('サインアウトできる', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.favorites).toEqual([]);
    });

    it('認証エラーが正しく処理される', async () => {
      const mockError = new Error('Authentication failed');
      mockSupabase.auth.signInWithPassword.mockRejectedValue(mockError);

      const { result } = renderHook(() => useFavorites());

      await expect(
        act(async () => {
          await result.current.signInWithEmail('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('設定管理', () => {
    beforeEach(() => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser 
          } 
        }
      });

      // user_preferences テーブルのモック
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'user_preferences') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            }),
            upsert: mockUpsert,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
    });

    it('お気に入り表示を切り替えられる', async () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.user = mockUser as any;
      });

      const initialShowFavorites = result.current.showFavorites;

      await act(async () => {
        await result.current.toggleShowFavorites();
      });

      expect(result.current.showFavorites).toBe(!initialShowFavorites);
    });

    it('比較モードを切り替えられる', async () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.user = mockUser as any;
      });

      const initialComparisonMode = result.current.comparisonMode;

      await act(async () => {
        await result.current.toggleComparisonMode();
      });

      expect(result.current.comparisonMode).toBe(!initialComparisonMode);
    });
  });

  describe('エラーハンドリング', () => {
    it('データベースエラー時にUIがロールバックされる', async () => {
      // エラーを返すモック
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ 
          error: { message: 'Database error' } 
        }),
      });

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser 
          } 
        }
      });

      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.user = mockUser as any;
      });

      const initialFavoritesLength = result.current.favorites.length;

      await act(async () => {
        await result.current.addFavorite(mockSakeData);
      });

      // エラー時は元の状態に戻ることを確認
      expect(result.current.favorites).toHaveLength(initialFavoritesLength);
    });
  });
});