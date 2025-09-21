'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useFavorites } from '@/features/favorites/hooks/useFavorites';
import { SakeData } from '@/types/sake';
import { User } from '@supabase/supabase-js';

interface FavoritesContextType {
  favorites: SakeData[];
  user: User | null;
  isLoading: boolean;
  showFavorites: boolean;
  addFavorite: (sake: SakeData) => Promise<void>;
  removeFavorite: (sakeId: string) => Promise<void>;
  isFavorite: (sakeId: string) => boolean;
  toggleShowFavorites: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

type FavoritesProviderProps = {
  children: ReactNode;
  initialFavorites?: SakeData[];
  initialShowFavorites?: boolean;
  initialUserId?: string;
};

export const FavoritesProvider = ({ children, initialFavorites, initialShowFavorites, initialUserId }: FavoritesProviderProps) => {
  const favoritesData = useFavorites({ initialFavorites, initialShowFavorites, initialUserId });

  return (
    <FavoritesContext.Provider value={favoritesData}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
};
