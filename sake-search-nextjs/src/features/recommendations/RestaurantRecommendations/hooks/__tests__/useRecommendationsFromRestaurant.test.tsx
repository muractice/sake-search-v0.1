import { renderHook, act } from '@testing-library/react';
import { SakeData } from '@/types/sake';
import { RecommendationResult } from '@/types/recommendations';
import { fetchRestaurantRecommendationsAction } from '@/app/actions/restaurantRecommendations';

jest.mock('@/app/actions/restaurantRecommendations', () => ({
  fetchRestaurantRecommendationsAction: jest.fn(),
}));

import { useRecommendationsFromRestaurant } from '../useRecommendationsFromRestaurant';

describe('useRecommendationsFromRestaurant', () => {
  const mockSake: SakeData = {
    id: 'sake-1',
    name: 'テスト酒',
    brewery: 'テスト酒造',
    description: '説明',
    sweetness: 0.2,
    richness: -0.1,
  };

  const baseResult: RecommendationResult = {
    sake: mockSake,
    score: 0.9,
    type: 'similarity',
    reason: 'テスト理由',
    similarityScore: 0.9,
    predictedRating: 4.5,
  };

  const setup = (override: Partial<Parameters<typeof useRecommendationsFromRestaurant>[0]> = {}) => {
    const props = {
      restaurantMenuItems: ['テスト酒'],
      restaurantMenuSakeData: [mockSake],
      onGachaResult: jest.fn(),
      ...override,
    } as const;

    const hook = renderHook(() => useRecommendationsFromRestaurant(props));
    return { hook, props };
  };

  beforeEach(() => {
    jest.resetAllMocks();
    window.alert = jest.fn();
  });

  it('ランダムレコメンドでガチャ結果をコールバックする', async () => {
    const { hook, props } = setup();
    const mockResult: RecommendationResult = { ...baseResult, type: 'random' };

    jest.mocked(fetchRestaurantRecommendationsAction).mockResolvedValue({
      recommendations: [mockResult],
      notFound: [],
      totalFound: 1,
    });

    await act(async () => {
      await hook.result.current.fetchRecommendations('random');
    });

    expect(fetchRestaurantRecommendationsAction).toHaveBeenCalledWith({
      type: 'random',
      menuItems: props.restaurantMenuItems,
      restaurantMenuSakeData: props.restaurantMenuSakeData,
      dishType: undefined,
      count: 10,
    });
    expect(props.onGachaResult).toHaveBeenCalledWith(mockResult);
    expect(hook.result.current.recommendations).toEqual([]);
  });

  it('お気に入り不足のケースを処理する', async () => {
    const { hook } = setup();

    jest.mocked(fetchRestaurantRecommendationsAction).mockResolvedValue({
      recommendations: [],
      notFound: [],
      totalFound: 1,
      requiresMoreFavorites: true,
      message: 'お気に入り不足',
    });

    await act(async () => {
      await hook.result.current.fetchRecommendations('similarity');
    });

    expect(hook.result.current.requiresMoreFavorites).toBe(true);
    expect(hook.result.current.favoritesMessage).toBe('お気に入り不足');
    expect(hook.result.current.recommendations).toEqual([]);
  });

  it('通常のレコメンドを状態に反映する', async () => {
    const { hook } = setup();

    jest.mocked(fetchRestaurantRecommendationsAction).mockResolvedValue({
      recommendations: [baseResult],
      notFound: [],
      totalFound: 1,
    });

    await act(async () => {
      await hook.result.current.fetchRecommendations('similarity');
    });

    expect(hook.result.current.recommendations).toEqual([baseResult]);
    expect(hook.result.current.requiresMoreFavorites).toBe(false);
    expect(hook.result.current.showRecommendations).toBe(true);
  });

  it('エラー時にalertを呼び出す', async () => {
    const { hook } = setup();
    const error = new Error('failure');

    jest.mocked(fetchRestaurantRecommendationsAction).mockRejectedValue(error);

    await act(async () => {
      await hook.result.current.fetchRecommendations('similarity');
    });

    expect(window.alert).toHaveBeenCalledWith('レコメンド機能でエラーが発生しました: failure');
    expect(hook.result.current.recommendations).toEqual([]);
  });
});
