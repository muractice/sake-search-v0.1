'use client';

import { useState } from 'react';
import { GachaSection } from './RestaurantRecommendations/components/GachaSection';
import { RecommendationTypeSelector } from './RestaurantRecommendations/components/RecommendationTypeSelector';
import { EmptyState } from './RestaurantRecommendations/components/EmptyState';
import { RecommendationList } from './RestaurantRecommendations/components/RecommendationList';
import { RecommendationResultSection } from './RestaurantRecommendations/components/RecommendationResultSection';
import { useGachaAnimation } from './RestaurantRecommendations/hooks/useGachaAnimation';
import { useRecommendationsFromRestaurant } from './RestaurantRecommendations/hooks/useRecommendationsFromRestaurant';
import { 
  RestaurantRecommendationType, 
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
    return <EmptyState />;
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
          <RecommendationTypeSelector
            recommendationType={recommendationType}
            showRecommendations={showRecommendations}
            onTypeSelect={(type) => {
              setRecommendationType(type);
              if (type === 'random') {
                resetGacha();
                setShowRecommendations(true);
              } else {
                fetchRecommendations(type);
              }
            }}
          />
        </div>
        
        {/* ガチャ関連の全ての表示 */}
        {recommendationType === 'random' && (
          <GachaSection
            showRecommendations={showRecommendations}
            isSlotAnimating={isSlotAnimating}
            slotItems={slotItems}
            slotRef={slotRef}
            selectedGachaItem={selectedGachaItem}
            isInComparison={isInComparison}
            onToggleComparison={onToggleComparison}
            onPlayAgain={() => {
              resetGacha();
              fetchRecommendations('random');
            }}
            onStartGacha={() => fetchRecommendations('random')}
          />
        )}
        
        {/* レコメンド結果表示 */}
        <RecommendationResultSection
          showRecommendations={showRecommendations}
          recommendationType={recommendationType}
          isLoadingRecommendations={isLoadingRecommendations}
          requiresMoreFavorites={requiresMoreFavorites}
          favoritesMessage={favoritesMessage}
          recommendations={recommendations}
          onToggleComparison={onToggleComparison}
          isInComparison={isInComparison}
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
};