'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { SearchTab } from '@/features/search/SearchTab';
import { FavoritesTab } from '@/features/favorites/FavoritesTab';
import { RecordsTab } from '@/features/records/RecordsTab';
import { UserProfile } from '@/features/auth/UserProfile';
import { AuthForm } from '@/features/auth/AuthForm';
import CustomDialog from '@/components/dialogs/CustomDialog';
import { FavoritesProvider } from '@/features/favorites/contexts/FavoritesContext';
import { AuthProvider } from '@/features/auth/contexts/AuthContext';
import { MenuProvider } from '@/features/menu/contexts/MenuContext';
import { useComparison } from '@/features/comparison/hooks/useComparison';
import { useSearch } from '@/features/search/hooks/useSearch';
import { useSelection } from '@/features/search/hooks/useSelection';
import type { SakeData } from '@/types/sake';

// 初期バンドルを軽量化するため、RestaurantTab を遅延ロード
const RestaurantTab = dynamic(() => import('@/features/restaurant/RestaurantTab').then(m => m.RestaurantTab), {
  ssr: false,
  loading: () => <div className="p-6 bg-white rounded-lg shadow">読み込み中...</div>,
});

type Props = {
  userId: string;
  initialFavorites: SakeData[];
  initialShowFavorites: boolean;
};

export function HomeClient({ userId, initialFavorites, initialShowFavorites }: Props) {
  const [activeTab, setActiveTab] = useState('search');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '酒えらび',
    message: ''
  });

  // FavoritesProvider にSSR初期値を注入し、以降はContextを唯一の真実にする

  // 検索タブ用の比較リスト
  const {
    comparisonList,
    toggleComparison,
    isInComparison,
    clearComparison,
  } = useComparison();

  // 飲食店タブ専用の比較リスト（別バケット）
  const {
    comparisonList: restaurantComparisonList,
    toggleComparison: toggleRestaurantComparison,
    isInComparison: isInRestaurantComparison,
    clearComparison: clearRestaurantComparison,
  } = useComparison();

  const {
    isLoading,
    search,
    currentSakeData,
  } = useSearch();

  const {
    selectSake,
    handleChartClick,
  } = useSelection();

  const handleSearch = async (query: string) => {
    try {
      const searchResult = await search(query);
      if (!searchResult) {
        setDialogState({
          isOpen: true,
          title: '酒えらび',
          message: '該当する日本酒が見つかりませんでした'
        });
      }
    } catch {
      setDialogState({
        isOpen: true,
        title: '酒えらび',
        message: '検索中にエラーが発生しました'
      });
    }
  };

  const handleToggleComparison = (sake: SakeData) => {
    if (comparisonList.length >= 10 && !isInComparison(sake.id)) {
      setDialogState({
        isOpen: true,
        title: '酒サーチ',
        message: '比較リストは10件までです。他のアイテムを削除してから追加してください。'
      });
      return;
    }
    toggleComparison(sake);
  };

  return (
    <AuthProvider>
      <MenuProvider>
        <FavoritesProvider
          initialFavorites={initialFavorites}
          initialShowFavorites={initialShowFavorites}
          initialUserId={userId}
        >
          <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <header className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 shadow-lg">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">酒えらび</h1>
                    <p className="text-lg text-blue-100">日本酒の味覚を視覚化</p>
                  </div>
                  <UserProfile onShowAuth={() => setShowAuthForm(true)} />
                </div>
              </div>
            </header>

            {/* タブ */}
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* メイン */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {activeTab === 'search' && (
                <SearchTab
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  searchResults={currentSakeData}
                  comparisonList={comparisonList}
                  onToggleComparison={handleToggleComparison}
                  onClearComparison={clearComparison}
                  onSelectSake={selectSake}
                  onChartClick={handleChartClick}
                  isInComparison={isInComparison}
                />
              )}

              {activeTab === 'restaurant' && (
                <RestaurantTab
                  comparisonList={restaurantComparisonList}
                  onToggleComparison={toggleRestaurantComparison}
                  isInComparison={isInRestaurantComparison}
                  onClearComparison={clearRestaurantComparison}
                  onTabChange={setActiveTab}
                />
              )}

              {activeTab === 'favorites' && (
                <FavoritesTab
                  userId={userId}
                  onSelectSake={selectSake}
                  onToggleComparison={handleToggleComparison}
                  isInComparison={isInComparison}
                />
              )}

              {activeTab === 'records' && (
                <RecordsTab />
              )}
            </main>

            {/* フッター */}
            <footer className="bg-white border-t border-gray-200 mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <p className="text-center text-gray-600">
                  &copy; 2025 酒えらび. All rights reserved. | データ提供:
                  <a href="https://sakenowa.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">さけのわ</a>
                </p>
              </div>
            </footer>

            {/* 認証モーダル */}
            {showAuthForm && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setShowAuthForm(false); }}
              >
                <AuthForm onClose={() => setShowAuthForm(false)} />
              </div>
            )}

            {/* ダイアログ */}
            <CustomDialog
              isOpen={dialogState.isOpen}
              title={dialogState.title}
              message={dialogState.message}
              onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
            />
          </div>
        </FavoritesProvider>
      </MenuProvider>
    </AuthProvider>
  );
}
