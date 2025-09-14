/**
 * Service層を使用した新しい検索フック
 * 段階的移行のため、既存のuseSearchと並行して提供
 */

import { useState, useCallback } from 'react';
import { SakeData } from '@/types/sake';
import { useSakeServiceV2 as useSakeService } from '@/providers/ServiceProvider';
import { 
  SakeSearchError, 
  SakeSearchOptions, 
  SakeSearchResult
} from '@/services/SakeService';

interface UseSearchState {
  currentSakeData: SakeData[];
  isLoading: boolean;
  error: string | null;
  lastQuery: string | null;
  hasMore: boolean;
  total: number;
}

interface UseSearchActions {
  search: (query: string, options?: Partial<SakeSearchOptions>) => Promise<SakeData | null>;
  searchWithFilters: (options: SakeSearchOptions) => Promise<SakeSearchResult>;
  clearSearch: () => void;
  clearError: () => void;
  getSuggestions: (query: string) => Promise<string[]>;
  loadMore: () => Promise<void>;
}

export interface UseSearchReturn extends UseSearchState, UseSearchActions {}

/**
 * Service層を使用する新しい検索フック
 */
export const useSearchV2 = (): UseSearchReturn => {
  const sakeService = useSakeService();
  
  const [state, setState] = useState<UseSearchState>({
    currentSakeData: [],
    isLoading: false,
    error: null,
    lastQuery: null,
    hasMore: false,
    total: 0,
  });

  // 状態更新のヘルパー
  const updateState = useCallback((updates: Partial<UseSearchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * シンプルな検索（後方互換性）
   */
  const search = useCallback(async (
    query: string, 
    options: Partial<SakeSearchOptions> = {}
  ): Promise<SakeData | null> => {
    if (!query.trim()) {
      updateState({ error: '検索クエリを入力してください' });
      return null;
    }

    updateState({ 
      isLoading: true, 
      error: null,
      lastQuery: query 
    });

    try {
      const searchOptions: SakeSearchOptions = {
        query,
        limit: 20,
        offset: 0,
        sortBy: 'relevance',
        ...options,
      };

      const result = await sakeService.searchSakes(searchOptions);
      
      updateState({
        currentSakeData: result.sakes,
        hasMore: result.hasMore,
        total: result.total,
        isLoading: false,
      });

      return result.sakes.length > 0 ? result.sakes[0] : null;
    } catch (error) {
      const errorMessage = error instanceof SakeSearchError 
        ? error.message 
        : '検索中にエラーが発生しました';
      
      updateState({
        currentSakeData: [],
        error: errorMessage,
        isLoading: false,
        hasMore: false,
        total: 0,
      });
      
      return null;
    }
  }, [sakeService, updateState]);

  /**
   * フィルター付き検索
   */
  const searchWithFilters = useCallback(async (
    options: SakeSearchOptions
  ): Promise<SakeSearchResult> => {
    updateState({ 
      isLoading: true, 
      error: null,
      lastQuery: options.query 
    });

    try {
      const result = await sakeService.searchSakes(options);
      
      updateState({
        currentSakeData: result.sakes,
        hasMore: result.hasMore,
        total: result.total,
        isLoading: false,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof SakeSearchError 
        ? error.message 
        : '検索中にエラーが発生しました';
      
      updateState({
        currentSakeData: [],
        error: errorMessage,
        isLoading: false,
        hasMore: false,
        total: 0,
      });
      
      throw error;
    }
  }, [sakeService, updateState]);

  /**
   * 検索結果をクリア
   */
  const clearSearch = useCallback(() => {
    setState({
      currentSakeData: [],
      isLoading: false,
      error: null,
      lastQuery: null,
      hasMore: false,
      total: 0,
    });
  }, []);

  /**
   * エラーメッセージをクリア
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * 検索候補を取得
   */
  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    try {
      return await sakeService.getSuggestions(query);
    } catch (error) {
      console.warn('検索候補の取得に失敗:', error);
      return [];
    }
  }, [sakeService]);

  /**
   * 追加データを読み込み（ページネーション）
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!state.hasMore || state.isLoading || !state.lastQuery) {
      return;
    }

    updateState({ isLoading: true });

    try {
      const result = await sakeService.searchSakes({
        query: state.lastQuery,
        offset: state.currentSakeData.length,
        limit: 20,
      });

      updateState({
        currentSakeData: [...state.currentSakeData, ...result.sakes],
        hasMore: result.hasMore,
        total: result.total,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof SakeSearchError 
        ? error.message 
        : '追加データの読み込みに失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [sakeService, updateState, state.hasMore, state.isLoading, state.lastQuery, state.currentSakeData]);

  return {
    // State
    currentSakeData: state.currentSakeData,
    isLoading: state.isLoading,
    error: state.error,
    lastQuery: state.lastQuery,
    hasMore: state.hasMore,
    total: state.total,
    
    // Actions
    search,
    searchWithFilters,
    clearSearch,
    clearError,
    getSuggestions,
    loadMore,
  };
};
