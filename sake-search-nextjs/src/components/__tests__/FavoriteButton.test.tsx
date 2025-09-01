import { render, screen, fireEvent } from '@testing-library/react';
import { FavoriteButton } from '../buttons/FavoriteButton';
import { SakeData } from '@/types/sake';

// FavoritesContextのモック
const mockContext = {
  user: { id: 'test-user-id', email: 'test@example.com' },
  favorites: [],
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

jest.mock('@/features/favorites/contexts/FavoritesContext', () => ({
  useFavoritesContext: () => mockContext
}));

describe('FavoriteButton', () => {
  const mockSakeData: SakeData = {
    id: 'test-sake-1',
    name: 'テスト日本酒',
    brewery: 'テスト蔵元',
    description: 'テスト用の日本酒です',
    sweetness: 1.5,
    richness: -0.8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーがログインしていない場合は表示されない', () => {
    mockContext.user = null;

    const { container } = render(<FavoriteButton sake={mockSakeData} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('ユーザーがログインしている場合はボタンが表示される', () => {
    mockContext.user = { id: 'test-user-id', email: 'test@example.com' };
    mockContext.isFavorite.mockReturnValue(false);

    render(<FavoriteButton sake={mockSakeData} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTitle('お気に入りに追加')).toBeInTheDocument();
  });

  it('お気に入りでない場合のボタン表示', () => {
    mockContext.user = { id: 'test-user-id', email: 'test@example.com' };
    mockContext.isFavorite.mockReturnValue(false);

    render(<FavoriteButton sake={mockSakeData} />);
    
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    
    expect(button).toHaveAttribute('title', 'お気に入りに追加');
    expect(svg).toHaveClass('text-gray-400');
    expect(svg).not.toHaveClass('text-red-500');
  });

  it('お気に入りの場合のボタン表示', () => {
    mockContext.user = { id: 'test-user-id', email: 'test@example.com' };
    mockContext.isFavorite.mockReturnValue(true);

    render(<FavoriteButton sake={mockSakeData} />);
    
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    
    expect(button).toHaveAttribute('title', 'お気に入りから削除');
    expect(svg).toHaveClass('text-red-500', 'fill-red-500');
  });

  it('お気に入りでない状態でクリックするとaddFavoriteが呼ばれる', () => {
    mockContext.user = { id: 'test-user-id', email: 'test@example.com' };
    mockContext.isFavorite.mockReturnValue(false);

    render(<FavoriteButton sake={mockSakeData} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockContext.addFavorite).toHaveBeenCalledWith(mockSakeData);
    expect(mockContext.removeFavorite).not.toHaveBeenCalled();
  });

  it('お気に入りの状態でクリックするとremoveFavoriteが呼ばれる', () => {
    mockContext.user = { id: 'test-user-id', email: 'test@example.com' };
    mockContext.isFavorite.mockReturnValue(true);

    render(<FavoriteButton sake={mockSakeData} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockContext.removeFavorite).toHaveBeenCalledWith(mockSakeData.id);
    expect(mockContext.addFavorite).not.toHaveBeenCalled();
  });

  it('カスタムクラス名が適用される', () => {
    mockContext.user = { id: 'test-user-id', email: 'test@example.com' };
    mockContext.isFavorite.mockReturnValue(false);

    render(<FavoriteButton sake={mockSakeData} className="custom-class" />);
    
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('custom-class');
  });

  it('ホバー効果のクラスが適用されている', () => {
    mockContext.user = { id: 'test-user-id', email: 'test@example.com' };
    mockContext.isFavorite.mockReturnValue(false);

    render(<FavoriteButton sake={mockSakeData} />);
    
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('hover:bg-gray-100', 'transition-colors');
  });
});