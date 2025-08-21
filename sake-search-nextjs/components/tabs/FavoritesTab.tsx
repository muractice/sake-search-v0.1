'use client';

import { PreferenceMap } from '@/components/PreferenceMap';
import { RecommendationDisplay } from '@/components/RecommendationDisplay';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { SakeData } from '@/types/sake';
import TasteChart from '@/components/TasteChart';
import SakeRadarChartSection from '@/components/SakeRadarChartSection';

interface FavoritesTabProps {
  onSelectSake: (sake: SakeData) => void;
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
}

export const FavoritesTab = ({
  onSelectSake,
  onToggleComparison,
  isInComparison,
}: FavoritesTabProps) => {
  const { favorites, removeFavorite } = useFavoritesContext();

  return (
    <div className="space-y-6">
      {/* お気に入り一覧 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">⭐</span>
          お気に入りの日本酒 ({favorites.length}件)
        </h2>
        
        {favorites.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            お気に入りに登録された日本酒がありません
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(sake => (
              <div
                key={sake.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{sake.name}</h3>
                  <button
                    onClick={() => removeFavorite(sake.id)}
                    className="text-red-500 hover:text-red-700"
                    title="お気に入りから削除"
                  >
                    ❌
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-3">{sake.brewery}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectSake(sake)}
                    className="flex-1 bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm 
                             hover:bg-blue-200 transition-colors"
                  >
                    詳細を見る
                  </button>
                  <button
                    onClick={() => onToggleComparison(sake)}
                    className={`flex-1 px-3 py-1 rounded text-sm transition-colors
                      ${isInComparison(sake.id)
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {isInComparison(sake.id) ? '比較中' : '比較する'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* お気に入りの味わいマップ */}
      {favorites.length > 0 && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3 text-2xl">📊</span>
              お気に入りの味わい分布
            </h2>
            <div className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
              <TasteChart 
                sakeData={favorites}
                onSakeClick={onSelectSake}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3 text-2xl">🎯</span>
              お気に入りの味覚特性
            </h2>
            <div className="min-h-[400px] md:min-h-[500px]">
              <SakeRadarChartSection sakeData={favorites} />
            </div>
          </div>
        </div>
      )}

      {/* 好み分析 */}
      <PreferenceMap />

      {/* レコメンド */}
      <RecommendationDisplay 
        onSelectSake={onSelectSake}
        onAddToComparison={onToggleComparison}
        isInComparison={isInComparison}
      />
    </div>
  );
};