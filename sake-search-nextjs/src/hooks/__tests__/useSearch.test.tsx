import { renderHook, act } from '@testing-library/react';
import { useSearch } from '@/features/search/hooks/useSearch';
import { SakeData } from '@/types/sake';
import { searchSakesAction } from '@/app/actions/search';

jest.mock('@/app/actions/search', () => ({
  searchSakesAction: jest.fn(),
}));

// テスト用のダミーデータ（現行のSakeData型に合わせる）
const createSakeData = (id: string, name: string): SakeData => ({
  id,
  brandId: 1,
  name,
  brewery: 'テスト酒造',
  breweryId: 1,
  sweetness: 0,
  richness: 0,
  description: '',
});

describe('useSearch', () => {
  beforeEach(() => {
    (searchSakesAction as jest.Mock).mockReset();
  });

  describe('初期状態', () => {
    test('検索データが空であること', () => {
      const { result } = renderHook(() => useSearch());
      expect(result.current.currentSakeData).toHaveLength(0);
    });

    test('ローディング状態がfalseであること', () => {
      const { result } = renderHook(() => useSearch());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('search機能', () => {
    test('成功時に検索データが設定されること', async () => {
      const mockSakeData = [
        createSakeData('1', '日本酒1'),
        createSakeData('2', '日本酒2'),
      ];

      (searchSakesAction as jest.Mock).mockResolvedValueOnce({
        sakes: mockSakeData,
        total: mockSakeData.length,
        query: 'テスト検索',
        hasMore: false,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() => useSearch());

      let selectedSake: SakeData | null = null;
      await act(async () => {
        selectedSake = await result.current.search('テスト検索');
      });

      expect(result.current.currentSakeData).toHaveLength(2);
      expect(result.current.currentSakeData[0].name).toBe('日本酒1');
      expect(selectedSake?.name).toBe('日本酒1'); // 最初の結果が選択される
    });

    test('検索結果が空の場合にnullを返すこと', async () => {
      (searchSakesAction as jest.Mock).mockResolvedValueOnce({
        sakes: [],
        total: 0,
        query: '存在しない日本酒',
        hasMore: false,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() => useSearch());

      let selectedSake: SakeData | null = null;
      await act(async () => {
        selectedSake = await result.current.search('存在しない日本酒');
      });

      expect(result.current.currentSakeData).toHaveLength(0);
      expect(selectedSake).toBe(null);
    });

    test('空の検索クエリの場合にnullを返すこと', async () => {
      const { result } = renderHook(() => useSearch());

      let selectedSake: SakeData | null = null;
      await act(async () => {
        selectedSake = await result.current.search('');
      });

      expect(selectedSake).toBe(null);
      expect(searchSakesAction).not.toHaveBeenCalled();
    });

    test('空白文字のみの検索クエリの場合にnullを返すこと', async () => {
      const { result } = renderHook(() => useSearch());

      let selectedSake: SakeData | null = null;
      await act(async () => {
        selectedSake = await result.current.search('   ');
      });

      expect(selectedSake).toBe(null);
      expect(searchSakesAction).not.toHaveBeenCalled();
    });

    test('ローディング状態が正しく管理されること', async () => {
      let resolvePromise: (value: unknown) => void;
      const searchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (searchSakesAction as jest.Mock).mockImplementationOnce(() => 
        searchPromise.then(() => ({
          sakes: [createSakeData('1', '日本酒1')],
          total: 1,
          query: 'テスト検索',
          hasMore: false,
          timestamp: new Date().toISOString(),
        }))
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.isLoading).toBe(false);

      // 検索開始（ローディング状態の変更を含む）
      let searchCall: Promise<unknown>;
      await act(async () => {
        searchCall = result.current.search('テスト検索');
        // 次のティックでローディング状態を確認
        await Promise.resolve();
      });
      
      expect(result.current.isLoading).toBe(true);

      // 検索完了
      resolvePromise!(true);
      await act(async () => {
        await searchCall!;
      });

      // 検索完了後はローディング状態が解除される
      expect(result.current.isLoading).toBe(false);
    });

    test('Server Actionに正しい引数で依頼されること', async () => {
      (searchSakesAction as jest.Mock).mockResolvedValueOnce({
        sakes: [createSakeData('1', '日本酒1')],
        total: 1,
        query: 'テスト 検索',
        hasMore: false,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.search('テスト 検索');
      });

      expect(searchSakesAction).toHaveBeenCalledWith({ query: 'テスト 検索', limit: 20, offset: 0 });
    });

    test('APIエラー時に例外がスローされること', async () => {
      const errorMessage = 'Network Error';
      (searchSakesAction as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await expect(result.current.search('テスト検索')).rejects.toThrow(errorMessage);
      });

      expect(result.current.currentSakeData).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearSearch機能', () => {
    test('検索データがクリアされること', async () => {
      const mockSakeData = [createSakeData('1', '日本酒1')];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          results: mockSakeData,
        }),
      } as Response);

      const { result } = renderHook(() => useSearch());

      // まず検索を実行
      await act(async () => {
        await result.current.search('テスト検索');
      });
      expect(result.current.currentSakeData).toHaveLength(1);

      // クリアを実行
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.currentSakeData).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('プライベート関数のテスト', () => {
    test('fetchSearchResultsとprocessSearchResultsは外部から呼び出せないこと', () => {
      const { result } = renderHook(() => useSearch());
      
      // returnされたオブジェクトに内部関数が含まれていないことを確認
      expect(result.current).not.toHaveProperty('fetchSearchResults');
      expect(result.current).not.toHaveProperty('processSearchResults');
    });

    test('公開APIのみが利用可能であること', () => {
      const { result } = renderHook(() => useSearch());
      
      // 公開されているプロパティとメソッドの確認
      expect(result.current).toHaveProperty('currentSakeData');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('search');
      expect(result.current).toHaveProperty('clearSearch');
    });
  });
});
