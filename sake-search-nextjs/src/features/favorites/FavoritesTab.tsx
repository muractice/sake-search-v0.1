'use client';

import { PreferenceMap } from '@/features/favorites/PreferenceMap';
import { RecommendationDisplay } from '@/features/favorites/RecommendationDisplay';
import { useFavoritesContext } from '@/features/favorites/contexts/FavoritesContext';
import { SakeData } from '@/types/sake';
import { TasteChartCard } from '@/components/charts/TasteChartCard';
import { RadarChartCard } from '@/components/charts/RadarChartCard';

interface FavoritesTabProps {
  favorites?: SakeData[];
  userId?: string;
  onSelectSake: (sake: SakeData) => void;
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
}

export const FavoritesTab = ({
  favorites: injectedFavorites,
  userId,
  onSelectSake,
  onToggleComparison,
  isInComparison,
}: FavoritesTabProps) => {
  const ctx = useFavoritesContext();
  const favorites = injectedFavorites ?? ctx.favorites;
  const effectiveUserId = userId ?? ctx.user?.id ?? '';

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
      <PreferenceMap userId={effectiveUserId} favorites={favorites} />

      {/* レコメンド */}
      <RecommendationDisplay 
        userId={effectiveUserId}
        favorites={favorites}
        onSelectSake={onSelectSake}
        onAddToComparison={onToggleComparison}
        isInComparison={isInComparison}
      />
    </div>
  );
};
