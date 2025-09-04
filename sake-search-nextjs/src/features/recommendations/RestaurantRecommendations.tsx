'use client';

import { useState } from 'react';
import { SakeData } from '@/types/sake';
import { GachaSlotAnimation } from './RestaurantRecommendations/components/GachaSlotAnimation';
import { GachaResult } from './RestaurantRecommendations/components/GachaResult';
import { useGachaAnimation } from './RestaurantRecommendations/hooks/useGachaAnimation';
import { useRecommendationsFromRestaurant } from './RestaurantRecommendations/hooks/useRecommendationsFromRestaurant';
import { 
  RestaurantRecommendationType, 
  RecommendationResult, 
  RestaurantRecommendationsProps 
} from './RestaurantRecommendations/types';

export const RestaurantRecommendations = ({
  restaurantMenuItems,
  restaurantMenuSakeData,
  onToggleComparison,
  isInComparison,
  onTabChange,
}: RestaurantRecommendationsProps) => {
  const [recommendationType, setRecommendationType] = useState<RestaurantRecommendationType>('similarity');
  const [pairingDishType] = useState('');
  
  // ガチャアニメーション関連は新しいカスタムフックに委譲
  const {
    isSlotAnimating,
    slotItems,
    selectedGachaItem,
    slotRef,
    startSlotAnimation,
    resetGacha,
  } = useGachaAnimation(restaurantMenuItems);
  
  // レコメンデーション関連のロジックをフックに委譲
  const {
    recommendations,
    isLoadingRecommendations,
    showRecommendations,
    requiresMoreFavorites,
    favoritesMessage,
    fetchRecommendations: fetchRecommendationsBase,
    setShowRecommendations,
  } = useRecommendationsFromRestaurant({
    restaurantMenuItems,
    restaurantMenuSakeData,
    onGachaResult: (result) => {
      startSlotAnimation(result);
    }
  });


  // fetchRecommendations関数をラップ（ガチャのリセット処理を追加）
  const fetchRecommendations = async (type: RestaurantRecommendationType) => {
    if (type === 'random') {
      resetGacha();
    }
    await fetchRecommendationsBase(type, pairingDishType);
  };

  if (restaurantMenuItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">💡</span>
          飲食店向けレコメンド
        </h2>
        <p className="text-gray-500 text-center py-8">
          メニューを登録すると、レコメンド機能が利用できます
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">💡</span>
        飲食店向けレコメンド
      </h2>
      
      <div className="space-y-4">
        {/* レコメンドタイプ選択 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setRecommendationType('similarity');
              fetchRecommendations('similarity');
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              recommendationType === 'similarity' && showRecommendations
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 お気に入りに近い順
          </button>
          <button
            onClick={() => {
              setRecommendationType('pairing');
              fetchRecommendations('pairing');
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              recommendationType === 'pairing' && showRecommendations
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🍴 料理に合わせる
          </button>
          <button
            onClick={() => {
              setRecommendationType('random');
              resetGacha();
              setShowRecommendations(true);
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              recommendationType === 'random' && showRecommendations
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎲 おすすめガチャ
          </button>
        </div>
        
        {/* ガチャスロット演出 */}
        <GachaSlotAnimation 
          isSlotAnimating={isSlotAnimating}
          slotItems={slotItems}
          slotRef={slotRef}
        />
        
        {/* ガチャ結果表示 */}
        {recommendationType === 'random' && selectedGachaItem && !isSlotAnimating && (
          <GachaResult
            selectedGachaItem={selectedGachaItem}
            isInComparison={isInComparison}
            onToggleComparison={onToggleComparison}
            onPlayAgain={() => {
              resetGacha();
              fetchRecommendations('random');
            }}
          />
        )}
        
        {/* ガチャのデフォルト表示（何も表示していない状態） */}
        {recommendationType === 'random' && !selectedGachaItem && !isSlotAnimating && showRecommendations && (
          <div className="mt-4 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-400">
            <div className="text-center">
              <p className="text-gray-500 mb-4">🎲 おすすめガチャをお楽しみください！</p>
              <p className="text-sm text-gray-400 mb-4">メニューからランダムに日本酒を選択します</p>
              <button
                onClick={() => fetchRecommendations('random')}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 font-bold text-lg"
              >
                🎰 ガチャを回す！
              </button>
            </div>
          </div>
        )}
        
        {/* レコメンド結果表示 */}
        {showRecommendations && recommendationType !== 'random' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-3">
              {recommendationType === 'similarity' && '🎯 あなたの好みに近い順'}
              {recommendationType === 'pairing' && '🍴 料理とのペアリング'}
            </h3>
            
            {recommendationType === 'pairing' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <span className="text-amber-600 mr-2">🚧</span>
                  <p className="text-amber-800 font-semibold">この機能は現在開発中です</p>
                </div>
                <p className="text-sm text-amber-700">
                  料理とのペアリング機能は近日公開予定です。もうしばらくお待ちください。
                </p>
                {/* 開発中でも見せるため、一旦コメントアウト
                <select
                  value={pairingDishType}
                  onChange={(e) => {
                    setPairingDishType(e.target.value);
                    if (e.target.value) {
                      fetchRecommendations('pairing');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                  disabled
                >
                  <option value="">料理を選択してください</option>
                  <option value="sashimi">刺身・お造り</option>
                  <option value="grilled">焼き物・炙り</option>
                  <option value="fried">揚げ物・天ぷら</option>
                  <option value="soup">汁物・鍋物</option>
                  <option value="dessert">デザート・甘味</option>
                  <option value="general">その他・おまかせ</option>
                </select>
                */}
              </div>
            )}
            
            <div className="space-y-2">
              {isLoadingRecommendations ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">レコメンドを生成中...</p>
                </div>
              ) : requiresMoreFavorites ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-yellow-800 mb-4">{favoritesMessage}</p>
                  {onTabChange && (
                    <button
                      onClick={() => onTabChange('search')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      「日本酒を調べる」タブで探す →
                    </button>
                  )}
                </div>
              ) : recommendations.length > 0 ? (
                <RecommendationList
                  recommendations={recommendations}
                  onToggleComparison={onToggleComparison}
                  isInComparison={isInComparison}
                />
              ) : (
                <p className="text-center text-gray-500 py-4">
                  レコメンドを表示するには、上のボタンから選択してください
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// レコメンドリストコンポーネント
interface RecommendationListProps {
  recommendations: RecommendationResult[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
}

const RecommendationList = ({
  recommendations,
  onToggleComparison,
  isInComparison,
}: RecommendationListProps) => {
  return (
    <>
      {recommendations.map((rec, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
            <div>
              <p className="font-semibold">{rec.sake.name}</p>
              <p className="text-xs text-gray-500">{rec.sake.brewery}</p>
              <p className="text-sm text-gray-600 mt-1">
                {rec.reason}
                {rec.similarityScore && ` (マッチ度: ${Math.round(rec.similarityScore * 100)}%)`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isInComparison(rec.sake.id)) {
                onToggleComparison(rec.sake);
              }
            }}
            disabled={isInComparison(rec.sake.id)}
            className={`px-3 py-1 rounded-lg text-sm ${
              isInComparison(rec.sake.id)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isInComparison(rec.sake.id) ? '追加済み' : '比較に追加'}
          </button>
        </div>
      ))}
    </>
  );
};