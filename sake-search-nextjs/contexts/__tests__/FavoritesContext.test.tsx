import { render, screen } from '@testing-library/react';
import { FavoritesProvider, useFavoritesContext } from '../FavoritesContext';
import { SakeData } from '@/types/sake';

// useFavoritesフックのモック
const mockUseFavorites = {
  favorites: [] as SakeData[],
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
};

jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => mockUseFavorites
}));

// テスト用コンポーネント
const TestComponent = () => {
  const context = useFavoritesContext();
  return (
    <div>
      <div data-testid="favorites-count">{context.favorites.length}</div>
      <div data-testid="user-status">{context.user ? 'logged-in' : 'logged-out'}</div>
      <div data-testid="loading-status">{context.isLoading ? 'loading' : 'loaded'}</div>
      <button 
        data-testid="add-favorite-btn" 
        onClick={() => context.addFavorite({
          id: 'test-id',
          name: 'Test Sake',
          brewery: 'Test Brewery',
          description: 'Test Description',
          sweetness: 0,
          richness: 0,
        })}
      >
        Add Favorite
      </button>
    </div>
  );
};

describe('FavoritesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('プロバイダーが正しく値を提供する', () => {
    render(
      <FavoritesProvider>
        <TestComponent />
      </FavoritesProvider>
    );

    expect(screen.getByTestId('favorites-count')).toHaveTextContent('0');
    expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
    expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
  });

  it('コンテキストのメソッドが正しく呼ばれる', () => {
    render(
      <FavoritesProvider>
        <TestComponent />
      </FavoritesProvider>
    );

    const addButton = screen.getByTestId('add-favorite-btn');
    addButton.click();

    expect(mockUseFavorites.addFavorite).toHaveBeenCalledWith({
      id: 'test-id',
      name: 'Test Sake',
      brewery: 'Test Brewery',
      description: 'Test Description',
      sweetness: 0,
      richness: 0,
    });
  });

  it('プロバイダー外での使用でエラーが投げられる', () => {
    // エラーをキャッチするためのコンソール警告を無効化
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useFavoritesContext must be used within a FavoritesProvider');

    consoleError.mockRestore();
  });

  it('ユーザーがログインしている状態', () => {
    mockUseFavorites.user = { id: 'test-user-id', email: 'test@example.com' };

    render(
      <FavoritesProvider>
        <TestComponent />
      </FavoritesProvider>
    );

    expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in');
  });

  it('お気に入りがある状態', () => {
    mockUseFavorites.favorites = [
      {
        id: 'sake-1',
        name: 'Test Sake 1',
        brewery: 'Test Brewery 1',
        description: 'Test Description 1',
        sweetness: 1,
        richness: -1,
      },
      {
        id: 'sake-2',
        name: 'Test Sake 2',
        brewery: 'Test Brewery 2',
        description: 'Test Description 2',
        sweetness: -1,
        richness: 1,
      }
    ];

    render(
      <FavoritesProvider>
        <TestComponent />
      </FavoritesProvider>
    );

    expect(screen.getByTestId('favorites-count')).toHaveTextContent('2');
  });

  it('ローディング状態', () => {
    mockUseFavorites.isLoading = true;

    render(
      <FavoritesProvider>
        <TestComponent />
      </FavoritesProvider>
    );

    expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
  });
});