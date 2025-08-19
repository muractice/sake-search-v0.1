'use client';

import { useState } from 'react';
import MenuScanner from '@/components/MenuScanner';
import TasteChart from '@/components/TasteChart';
import SakeRadarChartSection from '@/components/SakeRadarChartSection';
import ComparisonPanel from '@/components/ComparisonPanel';
import { SakeData } from '@/types/sake';

interface RestaurantTabProps {
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
  onSearch: (query: string) => Promise<SakeData | null>;
}

export const RestaurantTab = ({
  comparisonList,
  onToggleComparison,
  isInComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
  onSearch,
}: RestaurantTabProps) => {
  const [showMenuScanner, setShowMenuScanner] = useState(false);

  // メニューから見つかった日本酒を処理
  const handleSakeFound = async (sakeName: string) => {
    try {
      const searchResult = await onSearch(sakeName);
      
      if (searchResult) {
        // 比較リストの件数チェック（最大10件）
        if (comparisonList.length >= 10 && !isInComparison(searchResult.id)) {
          return { success: false, message: `比較リストは10件までです。他のアイテムを削除してから追加してください` };
        }
        
        // 検索結果を比較リストに追加（既に存在しない場合のみ）
        if (!isInComparison(searchResult.id)) {
          onToggleComparison(searchResult);
          return { success: true, message: `「${sakeName}」を比較に追加しました！` };
        } else {
          return { success: false, message: `「${sakeName}」は既に比較リストにあります` };
        }
      } else {
        return { success: false, message: `「${sakeName}」が見つかりませんでした` };
      }
    } catch {
      return { success: false, message: '検索中にエラーが発生しました' };
    }
  };

  // 複数の日本酒を一括処理
  const handleMultipleSakeFound = async (sakeNames: string[], updateStatus?: (statusMap: Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>) => void) => {
    let currentCount = comparisonList.length; // 現在の件数を追跡
    const statusMap = new Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>();

    for (const sakeName of sakeNames) {
      try {
        const searchResult = await onSearch(sakeName);
        
        if (searchResult) {
          // 既に存在するかチェック
          if (isInComparison(searchResult.id)) {
            statusMap.set(sakeName, {
              status: 'added',
              message: `「${sakeName}」は既に比較リストにあります`
            });
          } else {
            // 比較リストの件数チェック（動的に追跡）
            if (currentCount >= 10) {
              statusMap.set(sakeName, {
                status: 'limit_exceeded',
                message: `比較リストは10件までです`
              });
            } else {
              // 検索結果を比較リストに追加
              onToggleComparison(searchResult);
              currentCount++; // 件数を増加
              statusMap.set(sakeName, {
                status: 'added',
                message: `「${sakeName}」を比較に追加しました！`
              });
            }
          }
        } else {
          statusMap.set(sakeName, {
            status: 'not_found',
            message: `「${sakeName}」が見つかりませんでした`
          });
        }
      } catch {
        statusMap.set(sakeName, {
          status: 'not_found',
          message: 'エラーが発生しました'
        });
      }
    }

    // ステータスをスキャナーに渡す
    if (updateStatus) {
      updateStatus(statusMap);
    }
  };

  // 個別追加（ダイアログなし）
  const handleIndividualAdd = async (sakeName: string) => {
    try {
      const searchResult = await onSearch(sakeName);
      
      if (searchResult) {
        // 比較リストの件数チェック（最大10件）
        if (comparisonList.length >= 10 && !isInComparison(searchResult.id)) {
          return { success: false, message: `比較リストは10件までです。他のアイテムを削除してから追加してください` };
        }
        
        // 検索結果を比較リストに追加（既に存在しない場合のみ）
        if (!isInComparison(searchResult.id)) {
          onToggleComparison(searchResult);
          return { success: true, message: `「${sakeName}」を比較に追加しました！` };
        } else {
          return { success: false, message: `「${sakeName}」は既に比較リストにあります` };
        }
      } else {
        return { success: false, message: `「${sakeName}」が見つかりませんでした` };
      }
    } catch {
      return { success: false, message: '検索中にエラーが発生しました' };
    }
  };

  // 個別削除（ダイアログなし）
  const handleIndividualRemove = async (sakeName: string) => {
    try {
      const searchResult = await onSearch(sakeName);
      
      if (searchResult && isInComparison(searchResult.id)) {
        onToggleComparison(searchResult);
        return { success: true, message: `「${sakeName}」を比較リストから削除しました` };
      } else {
        return { success: false, message: `「${sakeName}」は比較リストにありません` };
      }
    } catch {
      return { success: false, message: '削除中にエラーが発生しました' };
    }
  };

  return (
    <div className="space-y-6">
      {/* メニュースキャナー起動ボタン */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">📷</span>
          メニューから日本酒を探す
        </h2>
        <p className="text-gray-600 mb-4">
          飲食店のメニュー写真を撮影またはアップロードして、
          メニューに掲載されている日本酒の味わいを確認できます。
        </p>
        <button
          onClick={() => setShowMenuScanner(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg 
                   hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>📷</span>
          メニューをスキャン
        </button>
      </div>

      {/* 比較パネル */}
      {comparisonList.length > 0 && (
        <ComparisonPanel
          comparisonList={comparisonList}
          onRemove={onToggleComparison}
          onClear={onClearComparison}
          onSelectSake={onSelectSake}
        />
      )}

      {/* チャート表示エリア */}
      {comparisonList.length > 0 && (
        <div className="space-y-8">
          {/* 4象限チャート */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3 text-2xl">📊</span>
              味わいマップ
            </h2>
            <div className="h-96 md:h-[500px] lg:h-[600px]">
              <TasteChart 
                sakeData={comparisonList}
                onSakeClick={onChartClick}
              />
            </div>
          </div>

          {/* レーダーチャート */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3 text-2xl">🎯</span>
              味覚特性
            </h2>
            <div className="min-h-[400px] md:min-h-[500px]">
              <SakeRadarChartSection sakeData={comparisonList} />
            </div>
          </div>
        </div>
      )}

      {/* レコメンド機能（将来の実装用） */}
      <div className="bg-gray-50 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">💡</span>
          料理に合わせたおすすめ
        </h2>
        <p className="text-gray-500 text-center py-8">
          料理に合わせた日本酒のレコメンド機能は今後実装予定です
        </p>
      </div>

      {/* メニュースキャナーモーダル */}
      {showMenuScanner && (
        <MenuScanner
          onClose={() => setShowMenuScanner(false)}
          onSakeFound={handleSakeFound}
          onMultipleSakeFound={handleMultipleSakeFound}
          onIndividualAdd={handleIndividualAdd}
          onIndividualRemove={handleIndividualRemove}
        />
      )}
    </div>
  );
};