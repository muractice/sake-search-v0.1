'use client';

import { useState, useCallback } from 'react';
import type { SakeData } from '@/types/sake';
import { removeFavoriteAction, updateShowFavoritesAction } from '@/app/actions/favorites';

type Props = {
  userId: string;
  initialFavorites: SakeData[];
  initialShowFavorites: boolean;
};

export function FavoritesPanel({ userId, initialFavorites, initialShowFavorites }: Props) {
  const [favorites, setFavorites] = useState<SakeData[]>(initialFavorites);
  const [showFavorites, setShowFavorites] = useState<boolean>(initialShowFavorites);

  // 追加は通常、各カードのUI側で行うため、ここでは提供しない

  const removeFavorite = useCallback(async (sakeId: string) => {
    if (!userId) return;
    const removed = favorites.find(s => s.id === sakeId);
    if (!removed) return;
    setFavorites(prev => prev.filter(s => s.id !== sakeId));
    try {
      await removeFavoriteAction(userId, sakeId);
    } catch {
      setFavorites(prev => [removed, ...prev]);
    }
  }, [userId, favorites]);

  const toggleShow = useCallback(async () => {
    const next = !showFavorites;
    setShowFavorites(next);
    if (!userId) return;
    try {
      await updateShowFavoritesAction(userId, next);
    } catch {
      setShowFavorites(prev => !prev);
    }
  }, [userId, showFavorites]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={toggleShow} className="px-3 py-1 rounded bg-gray-100">
          {showFavorites ? 'お気に入りを隠す' : 'お気に入りを表示'}
        </button>
        <span className="text-sm text-gray-600">{favorites.length}件</span>
      </div>
      {showFavorites && (
        <ul className="space-y-1">
          {favorites.map((s) => (
            <li key={s.id} className="flex items-center justify-between bg-white rounded px-3 py-2">
              <span>{s.name}</span>
              <button onClick={() => removeFavorite(s.id)} className="text-sm text-red-600">削除</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
