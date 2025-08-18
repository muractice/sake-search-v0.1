'use client';

import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { SakeData } from '@/types/sake';

interface FavoriteButtonProps {
  sake: SakeData;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const FavoriteButton = ({ 
  sake, 
  className = '', 
  size = 'md',
  showLabel = false
}: FavoriteButtonProps) => {
  const { user, isFavorite, addFavorite, removeFavorite } = useFavoritesContext();

  if (!user) {
    return null;
  }

  // 常にContextから最新の状態を取得
  const isFav = isFavorite(sake.id);

  const handleToggle = () => {
    if (isFav) {
      removeFavorite(sake.id);
    } else {
      addFavorite(sake);
    }
  };

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={handleToggle}
      className={`${sizeClasses[size]} rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1 ${className}`}
      title={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <svg
        className={`${iconSizeClasses[size]} ${isFav ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
        fill={isFav ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showLabel && (
        <span className={`text-xs ${isFav ? 'text-red-500' : 'text-gray-600'}`}>
          {isFav ? 'お気に入り済み' : 'お気に入り'}
        </span>
      )}
    </button>
  );
};