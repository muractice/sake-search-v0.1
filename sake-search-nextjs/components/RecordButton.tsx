'use client';

import { useState } from 'react';
import { SakeData } from '@/types/sake';
import { useRecords } from '@/hooks/useRecords';
import { useFavorites } from '@/hooks/useFavorites';

interface RecordButtonProps {
  sake: SakeData;
  className?: string;
}

export const RecordButton = ({ sake, className = '' }: RecordButtonProps) => {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(3);
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createRecord, hasRecordForSake, getRecordsForSake } = useRecords();
  const { user } = useFavorites();

  const existingRecords = getRecordsForSake(sake.id);
  const hasRecord = hasRecordForSake(sake.id);

  const handleSubmit = async () => {
    if (!user) {
      alert('記録を作成するにはログインが必要です');
      return;
    }

    setIsSubmitting(true);
    const success = await createRecord({
      sakeId: sake.id,
      sakeName: sake.name,
      sakeBrewery: sake.brewery,
      date,
      rating,
      memo: memo.trim() || undefined
    });

    if (success) {
      setShowForm(false);
      setRating(3);
      setMemo('');
      setDate(new Date().toISOString().split('T')[0]);
      alert('記録を保存しました');
    } else {
      alert('記録の保存に失敗しました');
    }
    setIsSubmitting(false);
  };

  if (showForm) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <h3 className="font-bold mb-3 flex items-center">
          <span className="mr-2">📝</span>
          飲酒記録を作成
        </h3>
        
        <div className="space-y-3">
          {/* 日付選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              飲んだ日
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 評価 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              評価
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-colors ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-gray-600">{rating}点</span>
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="味の感想、飲んだ場所など..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{memo.length}/500文字</p>
          </div>

          {/* ボタン */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              キャンセル
            </button>
          </div>
        </div>

        {/* 過去の記録がある場合は表示 */}
        {hasRecord && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              この日本酒は過去に{existingRecords.length}回記録しています
            </p>
            <div className="mt-2 space-y-1">
              {existingRecords.slice(0, 3).map((record) => (
                <div key={record.id} className="text-xs text-gray-500">
                  {record.date} - ★{record.rating}
                  {record.memo && ` - ${record.memo.substring(0, 20)}...`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      <span>📝</span>
      {hasRecord ? `記録を追加 (${existingRecords.length})` : '記録する'}
    </button>
  );
};