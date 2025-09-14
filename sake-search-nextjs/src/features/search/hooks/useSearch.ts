import { useCallback, useState } from 'react';
import { SakeData } from '@/types/sake';
import { searchSakesAction } from '@/app/actions/search';

// 既存の useSearch API を維持しつつ、内部実装を ServiceV2 経由に切替
export const useSearch = () => {

  // useSearchV2 相当の状態管理は ServiceV2 を都度呼び出す形に単純化
  // 画面で必要な状態はこのフックが返す最小限（従来通り）に限定
  const [state, setState] = useState({
    currentSakeData: [] as SakeData[],
    isLoading: false,
  });

  const search = useCallback(async (query: string): Promise<SakeData | null> => {
    if (!query.trim()) return null;

    setState((s) => ({ ...s, isLoading: true }));
    try {
      const result = await searchSakesAction({ query, limit: 20, offset: 0 });
      setState({ currentSakeData: result.sakes, isLoading: false });
      return result.sakes[0] ?? null;
    } catch (e) {
      console.error('Search error:', e);
      setState({ currentSakeData: [], isLoading: false });
      throw e;
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState({ currentSakeData: [], isLoading: false });
  }, []);

  return {
    currentSakeData: state.currentSakeData,
    isLoading: state.isLoading,
    search,
    clearSearch,
  };
};
