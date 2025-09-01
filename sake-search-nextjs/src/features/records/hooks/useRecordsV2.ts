/**
 * Service層を使用した新しい飲酒記録フック
 * 段階的移行のため、既存のuseRecordsと並行して提供
 */

import { useState, useCallback, useEffect } from 'react';
import { DrinkingRecord, CreateRecordInput, UpdateRecordInput } from '@/types/record';
import { useRecordService } from '@/providers/ServiceProvider';
import { 
  RecordServiceError, 
  RecordFilters,
  RecordSearchOptions, 
  RecordStatistics 
} from '@/services/RecordService';

interface UseRecordsState {
  records: DrinkingRecord[];
  isLoading: boolean;
  error: string | null;
  statistics: RecordStatistics | null;
  hasMore: boolean;
  total: number;
  lastFilters: RecordFilters | null;
}

interface UseRecordsActions {
  createRecord: (input: CreateRecordInput) => Promise<DrinkingRecord | null>;
  updateRecord: (recordId: string, input: UpdateRecordInput) => Promise<DrinkingRecord | null>;
  deleteRecord: (recordId: string) => Promise<boolean>;
  refreshRecords: () => Promise<void>;
  loadMoreRecords: () => Promise<void>;
  searchRecords: (options: RecordSearchOptions) => Promise<void>;
  clearError: () => void;
  clearRecords: () => void;
  
  // 便利メソッド
  hasRecordForSake: (sakeId: string) => Promise<boolean>;
  getRecordsForSake: (sakeId: string) => Promise<DrinkingRecord[]>;
  getRecentRecords: (limit?: number) => Promise<void>;
  getHighRatedRecords: (minRating?: number, limit?: number) => Promise<void>;
  getMonthlyRecords: (year: number, month: number) => Promise<void>;
  loadStatistics: () => Promise<void>;
}

export interface UseRecordsReturn extends UseRecordsState, UseRecordsActions {}

/**
 * Service層を使用する新しい飲酒記録フック
 */
export const useRecordsV2 = (): UseRecordsReturn => {
  const recordService = useRecordService();
  
  const [state, setState] = useState<UseRecordsState>({
    records: [],
    isLoading: false,
    error: null,
    statistics: null,
    hasMore: false,
    total: 0,
    lastFilters: null,
  });

  // 状態更新のヘルパー
  const updateState = useCallback((updates: Partial<UseRecordsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 飲酒記録を作成
   */
  const createRecord = useCallback(async (input: CreateRecordInput): Promise<DrinkingRecord | null> => {
    updateState({ error: null });

    try {
      const newRecord = await recordService.createRecord(input);
      
      // 既存のリストに新しい記録を追加（日付順でソート）
      updateState({
        records: [newRecord, ...state.records].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        total: state.total + 1,
      });

      return newRecord;
    } catch (error) {
      const errorMessage = error instanceof RecordServiceError 
        ? error.message 
        : '記録の作成に失敗しました';
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [recordService, updateState, state.records, state.total]);

  /**
   * 飲酒記録を更新
   */
  const updateRecord = useCallback(async (
    recordId: string, 
    input: UpdateRecordInput
  ): Promise<DrinkingRecord | null> => {
    updateState({ error: null });

    try {
      const updatedRecord = await recordService.updateRecord(recordId, input);
      
      // 記録リスト内の該当記録を更新
      updateState({
        records: state.records.map(record => 
          record.id === recordId ? updatedRecord : record
        ),
      });

      return updatedRecord;
    } catch (error) {
      const errorMessage = error instanceof RecordServiceError 
        ? error.message 
        : '記録の更新に失敗しました';
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [recordService, updateState, state.records]);

  /**
   * 飲酒記録を削除
   */
  const deleteRecord = useCallback(async (recordId: string): Promise<boolean> => {
    updateState({ error: null });

    try {
      await recordService.deleteRecord(recordId);
      
      // 記録リストから削除
      updateState({
        records: state.records.filter(record => record.id !== recordId),
        total: Math.max(0, state.total - 1),
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof RecordServiceError 
        ? error.message 
        : '記録の削除に失敗しました';
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [recordService, updateState, state.records, state.total]);

  /**
   * 記録を検索・取得
   */
  const searchRecords = useCallback(async (options: RecordSearchOptions = {}): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const result = await recordService.getRecords(options);
      
      updateState({
        records: result.records,
        hasMore: result.hasMore,
        total: result.total,
        lastFilters: options.filters || null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RecordServiceError 
        ? error.message 
        : '記録の取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
        records: [],
        hasMore: false,
        total: 0,
      });
    }
  }, [recordService, updateState]);

  /**
   * 記録を再読み込み
   */
  const refreshRecords = useCallback(async (): Promise<void> => {
    await searchRecords({
      filters: state.lastFilters || undefined,
      limit: Math.max(50, state.records.length), // 現在表示中の件数以上を取得
    });
  }, [searchRecords, state.lastFilters, state.records.length]);

  /**
   * 追加記録を読み込み（ページネーション）
   */
  const loadMoreRecords = useCallback(async (): Promise<void> => {
    if (!state.hasMore || state.isLoading) {
      return;
    }

    updateState({ isLoading: true });

    try {
      const result = await recordService.getRecords({
        filters: state.lastFilters || undefined,
        offset: state.records.length,
        limit: 50,
      });

      updateState({
        records: [...state.records, ...result.records],
        hasMore: result.hasMore,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RecordServiceError 
        ? error.message 
        : '追加記録の読み込みに失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [recordService, updateState, state.hasMore, state.isLoading, state.lastFilters, state.records]);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * 記録をクリア
   */
  const clearRecords = useCallback(() => {
    setState({
      records: [],
      isLoading: false,
      error: null,
      statistics: null,
      hasMore: false,
      total: 0,
      lastFilters: null,
    });
  }, []);

  /**
   * 特定の日本酒の記録があるかチェック
   */
  const hasRecordForSake = useCallback(async (sakeId: string): Promise<boolean> => {
    try {
      return await recordService.hasRecordForSake(sakeId);
    } catch (error) {
      console.warn('記録チェック中にエラー:', error);
      return false;
    }
  }, [recordService]);

  /**
   * 特定の日本酒の記録を取得
   */
  const getRecordsForSake = useCallback(async (sakeId: string): Promise<DrinkingRecord[]> => {
    try {
      return await recordService.getRecordsForSake(sakeId);
    } catch (error) {
      console.warn('日本酒記録取得中にエラー:', error);
      return [];
    }
  }, [recordService]);

  /**
   * 最近の記録を取得
   */
  const getRecentRecords = useCallback(async (limit: number = 10): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const records = await recordService.getRecentRecords(limit);
      
      updateState({
        records,
        hasMore: false, // 最近の記録なので追加読み込みなし
        total: records.length,
        lastFilters: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RecordServiceError 
        ? error.message 
        : '最近の記録取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [recordService, updateState]);

  /**
   * 高評価記録を取得
   */
  const getHighRatedRecords = useCallback(async (
    minRating: number = 4, 
    limit: number = 20
  ): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const records = await recordService.getHighRatedRecords(minRating, limit);
      
      updateState({
        records,
        hasMore: false, // 高評価記録なので追加読み込みなし
        total: records.length,
        lastFilters: { ratingMin: minRating },
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RecordServiceError 
        ? error.message 
        : '高評価記録取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [recordService, updateState]);

  /**
   * 月別記録を取得
   */
  const getMonthlyRecords = useCallback(async (year: number, month: number): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const records = await recordService.getMonthlyRecords(year, month);
      
      updateState({
        records,
        hasMore: false, // 月別記録なので追加読み込みなし
        total: records.length,
        lastFilters: {
          dateFrom: `${year}-${month.toString().padStart(2, '0')}-01`,
          dateTo: new Date(year, month, 0).toISOString().split('T')[0],
        },
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RecordServiceError 
        ? error.message 
        : '月別記録取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [recordService, updateState]);

  /**
   * 記録統計を読み込み
   */
  const loadStatistics = useCallback(async (): Promise<void> => {
    try {
      const statistics = await recordService.getStatistics();
      updateState({ statistics });
    } catch (error) {
      console.warn('統計情報の取得に失敗:', error);
      // 統計は補助情報なのでエラーにしない
    }
  }, [recordService, updateState]);

  // 初回データ読み込み
  useEffect(() => {
    searchRecords(); // デフォルトの条件で記録を読み込み
    loadStatistics(); // 統計も読み込み
  }, [searchRecords, loadStatistics]);

  return {
    // State
    records: state.records,
    isLoading: state.isLoading,
    error: state.error,
    statistics: state.statistics,
    hasMore: state.hasMore,
    total: state.total,
    lastFilters: state.lastFilters,
    
    // Actions
    createRecord,
    updateRecord,
    deleteRecord,
    refreshRecords,
    loadMoreRecords,
    searchRecords,
    clearError,
    clearRecords,
    
    // Utility methods
    hasRecordForSake,
    getRecordsForSake,
    getRecentRecords,
    getHighRatedRecords,
    getMonthlyRecords,
    loadStatistics,
  };
};