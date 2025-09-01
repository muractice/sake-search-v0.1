'use client';

import { useState } from 'react';
import { useRecords } from '@/features/records/hooks/useRecords';
import { DrinkingRecord } from '@/types/record';
import { PrefectureMap } from '@/features/records/PrefectureMap';
import { MenuManagement } from '@/features/restaurant/MenuManagement';
import { RestaurantRecords } from '@/features/records/RestaurantRecords';

type RecordType = 'sake' | 'restaurant';
type ViewMode = 'timeline' | 'map' | 'management';

export const RecordsTab = () => {
  const { records, isLoading, error, deleteRecord } = useRecords();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<RecordType>('sake');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  
  // レコードタイプが変更されたときのデフォルトビューモード設定
  const handleRecordTypeChange = (newRecordType: RecordType) => {
    setRecordType(newRecordType);
    // デフォルトビューモードを設定
    if (newRecordType === 'sake') {
      setViewMode('map'); // 日本酒記録は「マップ」がデフォルト
    } else {
      setViewMode('management'); // 飲食店管理は「メニュー管理」がデフォルト
    }
  };

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
      {/* セグメントコントロール - 2行構成 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4 mb-4">
          {/* 第1行: レコードタイプ切り替え */}
          <div className="flex justify-center">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => handleRecordTypeChange('sake')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  recordType === 'sake' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🍶 日本酒記録
              </button>
              <button
                onClick={() => handleRecordTypeChange('restaurant')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  recordType === 'restaurant' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🍽️ 飲食店管理
              </button>
            </div>
          </div>
          
          {/* 第2行: ビューモード切り替え */}
          <div className="flex justify-center">
            {recordType === 'sake' && (
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🗾 マップ
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'timeline' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📝 タイムライン
                </button>
              </div>
            )}
            
            {recordType === 'restaurant' && (
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode('management')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'management' 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🍽️ 飲食店管理
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'timeline' 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📝 記録一覧
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* 統計サマリー（日本酒記録の場合のみ） */}
        {recordType === 'sake' && (
          <div>
            <h2 className="text-xl font-bold flex items-center mb-4">
              <span className="mr-2">📊</span>
              日本酒記録サマリー
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
        )}
      </div>

      {/* コンテンツ表示 */}
      {recordType === 'sake' && viewMode === 'timeline' ? (
        /* 日本酒記録タイムライン表示 */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🍶</span>
            日本酒記録
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
                              {record.sakePrefecture && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {record.sakePrefecture}
                                </span>
                              )}
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
      ) : recordType === 'sake' && viewMode === 'map' ? (
        /* 日本酒記録マップ表示 */
        <PrefectureMap />
      ) : recordType === 'restaurant' && viewMode === 'timeline' ? (
        /* 飲食店記録一覧表示 */
        <RestaurantRecords />
      ) : recordType === 'restaurant' && viewMode === 'management' ? (
        /* 飲食店メニュー管理 */
        <MenuManagement 
          restaurantMenuSakeData={[]}
          onMenuUpdate={() => {}}
        />
      ) : null}
    </div>
  );
};