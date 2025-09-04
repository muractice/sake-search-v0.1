'use client';

import { useState, useCallback } from 'react';
import { SakeData } from '@/types/sake';
import { 
  RestaurantRecommendationType, 
  RecommendationResult 
} from '../types';

interface UseRecommendationsFromRestaurantProps {
  restaurantMenuItems: string[];
  restaurantMenuSakeData: SakeData[];
  onGachaResult?: (result: RecommendationResult) => void;
}

interface UseRecommendationsFromRestaurantReturn {
  // States
  recommendations: RecommendationResult[];
  isLoadingRecommendations: boolean;
  showRecommendations: boolean;
  requiresMoreFavorites: boolean;
  favoritesMessage: string;
  
  // Actions
  fetchRecommendations: (type: RestaurantRecommendationType, dishType?: string) => Promise<void>;
  setShowRecommendations: (show: boolean) => void;
  clearRecommendations: () => void;
}

export const useRecommendationsFromRestaurant = ({
  restaurantMenuItems,
  restaurantMenuSakeData,
  onGachaResult
}: UseRecommendationsFromRestaurantProps): UseRecommendationsFromRestaurantReturn => {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [requiresMoreFavorites, setRequiresMoreFavorites] = useState(false);
  const [favoritesMessage, setFavoritesMessage] = useState('');

  const fetchRecommendations = useCallback(async (
    type: RestaurantRecommendationType,
    dishType?: string
  ) => {
    // Validation
    if (restaurantMenuItems.length === 0) {
      alert('メニューアイテムを登録してください');
      return;
    }

    if (restaurantMenuSakeData.length === 0) {
      alert('メニューの日本酒データを取得してください');
      return;
    }

    setIsLoadingRecommendations(true);
    setShowRecommendations(true);

    try {
      const response = await fetch('/api/recommendations/restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          menuItems: restaurantMenuItems,
          restaurantMenuSakeData: restaurantMenuSakeData,
          dishType: type === 'pairing' ? dishType : undefined,
          count: 10
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}: ${response.statusText}`, errorText);
        throw new Error(`レコメンド取得エラー (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`🔍 RestaurantRecommendations API Response (${type}):`, {
        requiresMoreFavorites: data.requiresMoreFavorites,
        favoritesCount: data.favoritesCount,
        recommendationsCount: data.recommendations?.length || 0,
        message: data.message,
        totalFound: data.totalFound,
        notFoundCount: data.notFound?.length || 0
      });
      
      // お気に入り不足チェック（ガチャの場合は無視）
      if (data.requiresMoreFavorites && type !== 'random') {
        setRequiresMoreFavorites(true);
        setFavoritesMessage(data.message || '');
        setRecommendations([]);
      } else {
        setRequiresMoreFavorites(false);
        setFavoritesMessage('');
        
        // ガチャの場合は親コンポーネントにコールバック
        if (type === 'random' && data.recommendations.length > 0) {
          if (onGachaResult) {
            onGachaResult(data.recommendations[0]);
          }
        } else {
          setRecommendations(data.recommendations || []);
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
      // エラーを詳細表示
      alert(`レコメンド機能でエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [restaurantMenuItems, restaurantMenuSakeData, onGachaResult]);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setShowRecommendations(false);
    setRequiresMoreFavorites(false);
    setFavoritesMessage('');
  }, []);

  return {
    // States
    recommendations,
    isLoadingRecommendations,
    showRecommendations,
    requiresMoreFavorites,
    favoritesMessage,
    
    // Actions
    fetchRecommendations,
    setShowRecommendations,
    clearRecommendations,
  };
};