'use client';

import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { SakeData } from '@/types/sake';

interface FavoriteButtonProps {
  sake: SakeData;
  className?: string;
}

export const FavoriteButton = ({ sake, className = '' }: FavoriteButtonProps) => {
  const { user, isFavorite, addFavorite, removeFavorite } = useFavoritesContext();

  if (!user) {
    return null;
  }

  const isFav = isFavorite(sake.id);

  const handleToggle = () => {
    if (isFav) {
      removeFavorite(sake.id);
    } else {
      addFavorite(sake);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
      title={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <svg
        className={`w-5 h-5 ${isFav ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
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
    </button>
  );
};