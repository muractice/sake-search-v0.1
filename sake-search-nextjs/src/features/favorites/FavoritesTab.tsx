'use client';

import { PreferenceMap } from '@/features/favorites/PreferenceMap';
import { RecommendationDisplay } from '@/features/favorites/RecommendationDisplay';
import { useFavoritesContext } from '@/features/favorites/contexts/FavoritesContext';
import { SakeData } from '@/types/sake';
import { TasteChartCard } from '@/components/charts/TasteChartCard';
import { RadarChartCard } from '@/components/charts/RadarChartCard';

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
  const { favorites, user } = useFavoritesContext();
  
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
      {/* お気に入りの味わいマップ */}
      {favorites.length > 0 && (
        <div className="space-y-8">
          <TasteChartCard
            title="お気に入りの味わい分布"
            sakeData={favorites}
            onSakeClick={onSelectSake}
            minHeight="md"
          />
          
          <RadarChartCard
            title="お気に入りの味覚特性"
            sakeData={favorites}
            minHeight="sm"
          />
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