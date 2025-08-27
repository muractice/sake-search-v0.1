/**
 * Service層を使用した新しい比較機能フック
 * 段階的移行のため、既存のuseComparisonと並行して提供
 */

import { useState, useCallback, useEffect } from 'react';
import { SakeData } from '@/types/sake';
import { useComparisonService } from '@/providers/ServiceProvider';
import { 
  ComparisonServiceError,
  ComparisonSession,
  ComparisonAnalysis
} from '@/services/ComparisonService';

interface UseComparisonState {
  comparisonList: SakeData[];
  isLoading: boolean;
  error: string | null;
  currentSession: ComparisonSession | null;
  analysis: ComparisonAnalysis | null;
  shareUrl: string | null;
  history: ComparisonSession[];
  maxItems: number;
  minItems: number;
}

interface UseComparisonActions {
  // 基本操作
  addToComparison: (sake: SakeData) => boolean;
  removeFromComparison: (sakeId: string) => void;
  toggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  clearComparison: () => void;
  canAddMore: () => boolean;

  // セッション管理
  saveSession: () => Promise<boolean>;
  loadSession: (sessionId: string) => Promise<boolean>;
  loadCurrentSession: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>;

  // 分析・共有
  analyzeComparison: () => Promise<void>;
  createShareLink: () => Promise<string | null>;
  loadSharedComparison: (shareId: string) => Promise<boolean>;
  getRecommendations: (limit?: number) => Promise<SakeData[]>;

  // 履歴
  loadHistory: () => Promise<void>;

  // UI制御
  clearError: () => void;
  clearAnalysis: () => void;
}

export interface UseComparisonReturn extends UseComparisonState, UseComparisonActions {}

/**
 * Service層を使用する新しい比較機能フック
 */
export const useComparisonV2 = (): UseComparisonReturn => {
  const comparisonService = useComparisonService();
  
  const [state, setState] = useState<UseComparisonState>({
    comparisonList: [],
    isLoading: false,
    error: null,
    currentSession: null,
    analysis: null,
    shareUrl: null,
    history: [],
    maxItems: comparisonService.getMaxComparisonItems(),
    minItems: comparisonService.getMinComparisonItems(),
  });

  // 状態更新のヘルパー
  const updateState = useCallback((updates: Partial<UseComparisonState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 比較リストに追加
   */
  const addToComparison = useCallback((sake: SakeData): boolean => {
    // 既に追加済みチェック
    if (state.comparisonList.some(s => s.id === sake.id)) {
      return true;
    }

    // 最大数チェック
    if (!comparisonService.canAddToComparison(state.comparisonList.length)) {
      updateState({ 
        error: `比較は最大${state.maxItems}個までです` 
      });
      return false;
    }

    updateState({
      comparisonList: [...state.comparisonList, sake],
      error: null,
      analysis: null, // 分析をクリア
    });

    return true;
  }, [comparisonService, updateState, state.comparisonList, state.maxItems]);

  /**
   * 比較リストから削除
   */
  const removeFromComparison = useCallback((sakeId: string): void => {
    updateState({
      comparisonList: state.comparisonList.filter(s => s.id !== sakeId),
      analysis: null, // 分析をクリア
    });
  }, [updateState, state.comparisonList]);

  /**
   * 比較リストの切り替え
   */
  const toggleComparison = useCallback((sake: SakeData): void => {
    if (state.comparisonList.some(s => s.id === sake.id)) {
      removeFromComparison(sake.id);
    } else {
      addToComparison(sake);
    }
  }, [state.comparisonList, addToComparison, removeFromComparison]);

  /**
   * 比較リストに含まれているかチェック
   */
  const isInComparison = useCallback((sakeId: string): boolean => {
    return state.comparisonList.some(s => s.id === sakeId);
  }, [state.comparisonList]);

  /**
   * 比較リストをクリア
   */
  const clearComparison = useCallback((): void => {
    updateState({
      comparisonList: [],
      analysis: null,
      shareUrl: null,
      error: null,
    });
  }, [updateState]);

  /**
   * さらに追加可能かチェック
   */
  const canAddMore = useCallback((): boolean => {
    return comparisonService.canAddToComparison(state.comparisonList.length);
  }, [comparisonService, state.comparisonList.length]);

  /**
   * セッションを保存
   */
  const saveSession = useCallback(async (): Promise<boolean> => {
    if (state.comparisonList.length === 0) {
      updateState({ error: '比較リストが空です' });
      return false;
    }

    updateState({ isLoading: true, error: null });

    try {
      const session = await comparisonService.saveComparisonSession(state.comparisonList);
      updateState({
        currentSession: session,
        isLoading: false,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof ComparisonServiceError 
        ? error.message 
        : 'セッションの保存に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      return false;
    }
  }, [comparisonService, updateState, state.comparisonList]);

  /**
   * セッションを読み込み
   */
  const loadSession = useCallback(async (sessionId: string): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      const session = await comparisonService.getComparisonSession(sessionId);
      updateState({
        comparisonList: session.sakes,
        currentSession: session,
        isLoading: false,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof ComparisonServiceError 
        ? error.message 
        : 'セッションの読み込みに失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      return false;
    }
  }, [comparisonService, updateState]);

  /**
   * 現在のセッションを読み込み
   */
  const loadCurrentSession = useCallback(async (): Promise<void> => {
    try {
      const session = await comparisonService.getCurrentUserSession();
      if (session) {
        updateState({
          comparisonList: session.sakes,
          currentSession: session,
        });
      }
    } catch (error) {
      console.warn('現在のセッション読み込みエラー:', error);
      // エラーは表示しない（初期読み込み時のため）
    }
  }, [comparisonService, updateState]);

  /**
   * セッションを削除
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    updateState({ error: null });

    try {
      await comparisonService.deleteComparisonSession(sessionId);
      
      // 現在のセッションが削除された場合はクリア
      if (state.currentSession?.id === sessionId) {
        updateState({
          currentSession: null,
          comparisonList: [],
        });
      }
      
      // 履歴から削除
      updateState({
        history: state.history.filter(s => s.id !== sessionId),
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof ComparisonServiceError 
        ? error.message 
        : 'セッションの削除に失敗しました';
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [comparisonService, updateState, state.currentSession, state.history]);

  /**
   * 比較分析を実行
   */
  const analyzeComparison = useCallback(async (): Promise<void> => {
    if (!comparisonService.canAnalyze(state.comparisonList.length)) {
      updateState({ 
        error: `分析には最低${state.minItems}個の日本酒が必要です` 
      });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const analysis = await comparisonService.analyzeComparison(state.comparisonList);
      updateState({
        analysis,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof ComparisonServiceError 
        ? error.message 
        : '分析の実行に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [comparisonService, updateState, state.comparisonList, state.minItems]);

  /**
   * 共有リンクを作成
   */
  const createShareLink = useCallback(async (): Promise<string | null> => {
    if (state.comparisonList.length === 0) {
      updateState({ error: '比較リストが空です' });
      return null;
    }

    updateState({ isLoading: true, error: null });

    try {
      const url = await comparisonService.createShareableLink(state.comparisonList);
      updateState({
        shareUrl: url,
        isLoading: false,
      });
      return url;
    } catch (error) {
      const errorMessage = error instanceof ComparisonServiceError 
        ? error.message 
        : '共有リンクの作成に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      return null;
    }
  }, [comparisonService, updateState, state.comparisonList]);

  /**
   * 共有された比較リストを読み込み
   */
  const loadSharedComparison = useCallback(async (shareId: string): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      const session = await comparisonService.getSharedComparison(shareId);
      updateState({
        comparisonList: session.sakes,
        currentSession: session,
        isLoading: false,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof ComparisonServiceError 
        ? error.message 
        : '共有リストの読み込みに失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      return false;
    }
  }, [comparisonService, updateState]);

  /**
   * レコメンドを取得
   */
  const getRecommendations = useCallback(async (limit: number = 5): Promise<SakeData[]> => {
    if (state.comparisonList.length === 0) {
      return [];
    }

    try {
      return await comparisonService.getComparisonRecommendations(state.comparisonList, limit);
    } catch (error) {
      console.warn('レコメンド取得エラー:', error);
      return [];
    }
  }, [comparisonService, state.comparisonList]);

  /**
   * 比較履歴を読み込み
   */
  const loadHistory = useCallback(async (): Promise<void> => {
    try {
      const history = await comparisonService.getComparisonHistory();
      updateState({ history });
    } catch (error) {
      console.warn('履歴読み込みエラー:', error);
      // 履歴は補助情報なのでエラー表示しない
    }
  }, [comparisonService, updateState]);

  /**
   * エラーをクリア
   */
  const clearError = useCallback((): void => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * 分析結果をクリア
   */
  const clearAnalysis = useCallback((): void => {
    updateState({ analysis: null });
  }, [updateState]);

  // 初回読み込み: 現在のセッションと履歴
  useEffect(() => {
    loadCurrentSession();
    loadHistory();
  }, []);

  return {
    // State
    comparisonList: state.comparisonList,
    isLoading: state.isLoading,
    error: state.error,
    currentSession: state.currentSession,
    analysis: state.analysis,
    shareUrl: state.shareUrl,
    history: state.history,
    maxItems: state.maxItems,
    minItems: state.minItems,
    
    // Basic Actions
    addToComparison,
    removeFromComparison,
    toggleComparison,
    isInComparison,
    clearComparison,
    canAddMore,
    
    // Session Actions
    saveSession,
    loadSession,
    loadCurrentSession,
    deleteSession,
    
    // Analysis & Share Actions
    analyzeComparison,
    createShareLink,
    loadSharedComparison,
    getRecommendations,
    
    // History Actions
    loadHistory,
    
    // UI Actions
    clearError,
    clearAnalysis,
  };
};