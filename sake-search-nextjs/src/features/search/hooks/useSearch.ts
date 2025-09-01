import { useState, useCallback } from 'react';
import { SakeData } from '@/types/sake';

interface SearchResult {
  success: boolean;
  results: SakeData[];
}

export const useSearch = () => {
  const [currentSakeData, setCurrentSakeData] = useState<SakeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // プライベート関数（外部に公開しない）
  const fetchSearchResults = async (query: string): Promise<SearchResult> => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return await response.json();
  };

  const processSearchResults = useCallback((data: SearchResult) => {
    if (data.success && data.results.length > 0) {
      setCurrentSakeData(data.results);
      return data.results[0]; // 最初の結果を選択用として返す
    } else {
      setCurrentSakeData([]);
      return null;
    }
  }, []); // setCurrentSakeDataは安定しているので空の依存配列

  // パブリックAPI - useCallbackで安定化
  const search = useCallback(async (query: string): Promise<SakeData | null> => {
    if (!query.trim()) return null;

    setIsLoading(true);
    try {
      const data = await fetchSearchResults(query);
      const selectedSake = processSearchResults(data);
      
      if (!selectedSake) {
        // エラー通知は呼び出し側で行う（関心の分離）
      }
      
      return selectedSake;
    } catch (error) {
      console.error('Search error:', error);
      setCurrentSakeData([]);
      throw error; // エラーハンドリングは呼び出し側に委ねる
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearSearch = useCallback(() => {
    setCurrentSakeData([]);
    setIsLoading(false);
  }, []); // set関数は安定しているので空の依存配列

  // 公開するAPIのみreturn
  return {
    // 状態
    currentSakeData,
    isLoading,
    
    // メソッド（publicのみ）
    search,
    clearSearch,
  };
};