'use client';

import { PreferenceMap } from '@/features/favorites/PreferenceMap';
import { RecommendationDisplay } from '@/features/favorites/RecommendationDisplay';
import { useFavoritesContext } from '@/features/favorites/contexts/FavoritesContext';
import { SakeData } from '@/types/sake';
import TasteChart from '@/components/charts/TasteChart';
import SakeRadarChartSection from '@/features/comparison/SakeRadarChartSection';

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
  const { favorites, removeFavorite, user } = useFavoritesContext();
  
  // ログイン状態確認のログ出力
  console.log('🌟 FavoritesTab状態:', {
    isLoggedIn: !!user,
    userId: user?.id,
    userEmail: user?.email,
    favoritesCount: favorites.length,
    favoritesItems: favorites.map(f => f.name)
  });

  return (
    <div className="space-y-6">
      {/* お気に入り一覧 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
          <span className="mr-2">⭐</span>
          お気に入りの日本酒 ({favorites.length}件)
        </h2>
        
        {favorites.length === 0 ? (
          <p className="text-gray-700 text-center py-8">
            お気に入りに登録された日本酒がありません
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((sake, index) => (
              <div
                key={sake.id}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-purple-200 animate-fade-in hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 
                        className="font-bold text-base cursor-pointer hover:text-blue-600 transition-colors text-gray-900"
                        onClick={() => onSelectSake(sake)}
                        title="クリックして詳細を表示"
                      >
                        {sake.name}
                      </h3>
                      <p className="text-sm text-gray-800 font-medium">{sake.brewery}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFavorite(sake.id)}
                    className="text-red-500 hover:text-red-700 transition-colors text-xl"
                    title="お気に入りから削除"
                  >
                    ✕
                  </button>
                </div>
                
                {/* 特徴 */}
                <div className="mb-3 p-3 bg-white/70 rounded-lg">
                  <p className="text-sm text-gray-900 leading-relaxed font-medium">
                    {sake.description || '説明がありません'}
                  </p>
                </div>
                
                {/* 味覚指標 */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-800 font-semibold">甘辛:</span>
                    <span className="font-bold text-gray-900">
                      {sake.sweetness > 0 ? `甘口 +${sake.sweetness.toFixed(1)}` : `辛口 ${sake.sweetness.toFixed(1)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-800 font-semibold">淡濃:</span>
                    <span className="font-bold text-gray-900">
                      {sake.richness > 0 ? `濃醇 +${sake.richness.toFixed(1)}` : `淡麗 ${sake.richness.toFixed(1)}`}
                    </span>
                  </div>
                </div>
                
                {/* ボタン */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert('準備中です');
                    }}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium"
                  >
                    購入する
                  </button>
                  <button
                    onClick={() => onToggleComparison(sake)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors font-medium
                      ${isInComparison(sake.id)
                        ? 'bg-gray-300 text-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    {isInComparison(sake.id) ? '追加済' : '比較'}
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
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
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
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
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