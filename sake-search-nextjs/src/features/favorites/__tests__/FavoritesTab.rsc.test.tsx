import { render, screen } from '@testing-library/react';
import { FavoritesTab } from '@/features/favorites/FavoritesTab';
import type { SakeData } from '@/types/sake';

// 軽量化のため重い子コンポーネントをモック
jest.mock('@/components/charts/TasteChartCard', () => ({
  TasteChartCard: ({ title, sakeData }: { title: string; sakeData: SakeData[] }) => (
    <div data-testid="taste-chart-card">
      <span>{title}</span>
      <span data-testid="taste-count">{sakeData.length}</span>
    </div>
  )
}));

jest.mock('@/components/charts/RadarChartCard', () => ({
  RadarChartCard: ({ title }: { title: string }) => (
    <div data-testid="radar-chart-card">{title}</div>
  )
}));

jest.mock('@/features/favorites/PreferenceMap', () => ({
  PreferenceMap: () => <div data-testid="preference-map" />
}));

jest.mock('@/features/favorites/RecommendationDisplay', () => ({
  RecommendationDisplay: () => <div data-testid="recommendation-display" />
}));

// FavoritesContextは呼ばれるが、今回はprops経路を検証するため最小モック
jest.mock('@/features/favorites/contexts/FavoritesContext', () => ({
  useFavoritesContext: () => ({
    favorites: [],
    user: null,
    isLoading: false,
    showFavorites: true,
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    isFavorite: jest.fn(),
    toggleShowFavorites: jest.fn(),
    signInWithEmail: jest.fn(),
    signUpWithEmail: jest.fn(),
    signOut: jest.fn(),
  }),
}));

describe('FavoritesTab (RSC props path)', () => {
  const favorites: SakeData[] = [
    { id: 's1', name: '一番', brewery: '蔵1', description: '', sweetness: 0.5, richness: -0.2 },
    { id: 's2', name: '二番', brewery: '蔵2', description: '', sweetness: -0.1, richness: 0.8 },
  ];

  it('propsで渡したfavoritesをTasteChartCardへ渡す', () => {
    render(
      <FavoritesTab
        favorites={favorites}
        userId="u1"
        onSelectSake={jest.fn()}
        onToggleComparison={jest.fn()}
        isInComparison={() => false}
      />
    );

    expect(screen.getByTestId('taste-chart-card')).toBeInTheDocument();
    expect(screen.getByTestId('taste-count').textContent).toBe(String(favorites.length));
    expect(screen.getByTestId('radar-chart-card')).toBeInTheDocument();
    expect(screen.getByTestId('preference-map')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-display')).toBeInTheDocument();
  });
});

