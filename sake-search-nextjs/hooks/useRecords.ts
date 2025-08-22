'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DrinkingRecord, CreateRecordInput } from '@/types/record';

export const useRecords = () => {
  const [records, setRecords] = useState<DrinkingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // 記録一覧を取得
  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecords([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('drinking_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // スネークケースからキャメルケースに変換
      const mappedRecords = (data || []).map(record => ({
        id: record.id,
        userId: record.user_id,
        sakeId: record.sake_id,
        sakeName: record.sake_name,
        sakeBrewery: record.sake_brewery,
        date: record.date,
        rating: record.rating,
        memo: record.memo,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));

      setRecords(mappedRecords);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError('記録の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 記録を作成
  const createRecord = async (input: CreateRecordInput): Promise<boolean> => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('ログインが必要です');
        return false;
      }

      // 今日の日付をデフォルトに設定
      const recordDate = input.date || new Date().toISOString().split('T')[0];

      const { data, error: createError } = await supabase
        .from('drinking_records')
        .insert([
          {
            user_id: user.id,
            sake_id: input.sakeId,
            sake_name: input.sakeName,
            sake_brewery: input.sakeBrewery,
            date: recordDate,
            rating: input.rating,
            memo: input.memo
          }
        ])
        .select()
        .single();

      if (createError) throw createError;

      // スネークケースからキャメルケースに変換
      const mappedRecord = {
        id: data.id,
        userId: data.user_id,
        sakeId: data.sake_id,
        sakeName: data.sake_name,
        sakeBrewery: data.sake_brewery,
        date: data.date,
        rating: data.rating,
        memo: data.memo,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      // 記録リストを更新
      setRecords(prev => [mappedRecord, ...prev]);
      return true;
    } catch (err) {
      console.error('Error creating record:', err);
      setError('記録の作成に失敗しました');
      return false;
    }
  };

  // 記録を削除
  const deleteRecord = async (recordId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('drinking_records')
        .delete()
        .eq('id', recordId);

      if (deleteError) throw deleteError;

      // 記録リストから削除
      setRecords(prev => prev.filter(r => r.id !== recordId));
      return true;
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('記録の削除に失敗しました');
      return false;
    }
  };

  // 同じ日本酒の記録があるかチェック
  const hasRecordForSake = useCallback((sakeId: string): boolean => {
    return records.some(r => r.sakeId === sakeId);
  }, [records]);

  // 特定の日本酒の記録を取得
  const getRecordsForSake = useCallback((sakeId: string): DrinkingRecord[] => {
    return records.filter(r => r.sakeId === sakeId);
  }, [records]);

  // コンポーネントマウント時に記録を取得
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    isLoading,
    error,
    createRecord,
    deleteRecord,
    hasRecordForSake,
    getRecordsForSake,
    refreshRecords: fetchRecords
  };
};