'use client';

import { SakeData } from '@/types/sake';
import { FavoriteCard } from './FavoriteCard';
import { EmptyFavorites } from './EmptyFavorites';

interface FavoritesListProps {
  favorites: SakeData[];
  onSelectSake: (sake: SakeData) => void;
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onRemoveFavorite: (sakeId: string) => void;
}

export const FavoritesList = ({
  favorites,
  onSelectSake,
  onToggleComparison,
  isInComparison,
  onRemoveFavorite,
}: FavoritesListProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
        <span className="mr-2">⭐</span>
        お気に入りの日本酒 ({favorites.length}件)
      </h2>
      
      {favorites.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((sake, index) => (
            <FavoriteCard
              key={sake.id}
              sake={sake}
              index={index}
              onSelectSake={onSelectSake}
              onToggleComparison={onToggleComparison}
              isInComparison={isInComparison}
              onRemove={onRemoveFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};