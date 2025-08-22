'use client';

import { useState } from 'react';
import { useRecords } from '@/hooks/useRecords';
import { DrinkingRecord } from '@/types/record';

export const RecordsTab = () => {
  const { records, isLoading, error, deleteRecord } = useRecords();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (record: DrinkingRecord) => {
    if (!confirm(`「${record.sakeName}」の記録を削除しますか？`)) {
      return;
    }

    setDeletingId(record.id);
    const success = await deleteRecord(record.id);
    if (success) {
      // 削除成功（自動的にリストから消える）
    } else {
      alert('削除に失敗しました');
    }
    setDeletingId(null);
  };

  // 月別にグループ化
  const groupedRecords = records.reduce((acc, record) => {
    const month = record.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(record);
    return acc;
  }, {} as { [key: string]: DrinkingRecord[] });

  const sortedMonths = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-xl font-bold mb-2">まだ記録がありません</h2>
        <p className="text-gray-600 mb-4">
          日本酒を検索して、飲んだ記録を残してみましょう
        </p>
        <p className="text-sm text-gray-500">
          「日本酒を調べる」タブから日本酒を検索し、<br />
          詳細画面で「記録する」ボタンを押して記録を作成できます
        </p>
      </div>
    );
  }

  // 統計情報
  const totalRecords = records.length;
  const uniqueSakes = new Set(records.map(r => r.sakeId)).size;
  const averageRating = records.reduce((sum, r) => sum + r.rating, 0) / totalRecords;

  return (
    <div className="space-y-6">
      {/* 統計サマリー */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">📊</span>
          記録サマリー
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{totalRecords}</div>
            <div className="text-sm text-gray-600">総記録数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{uniqueSakes}</div>
            <div className="text-sm text-gray-600">銘柄数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">平均評価</div>
          </div>
        </div>
      </div>

      {/* 記録一覧 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">🍶</span>
          飲酒記録
        </h2>

        <div className="space-y-6">
          {sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const monthLabel = `${year}年${parseInt(monthNum)}月`;
            const monthRecords = groupedRecords[month];

            return (
              <div key={month}>
                <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                  {monthLabel} ({monthRecords.length}件)
                </h3>
                <div className="space-y-3">
                  {monthRecords.map(record => (
                    <div
                      key={record.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-gray-500">
                              {record.date}
                            </span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-lg ${
                                    i < record.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <h4 className="font-semibold text-lg mb-1">
                            {record.sakeName}
                          </h4>
                          {record.sakeBrewery && (
                            <p className="text-sm text-gray-600 mb-2">
                              {record.sakeBrewery}
                            </p>
                          )}
                          {record.memo && (
                            <p className="text-sm text-gray-700 bg-white rounded p-2">
                              {record.memo}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(record)}
                          disabled={deletingId === record.id}
                          className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === record.id ? '削除中...' : '削除'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};