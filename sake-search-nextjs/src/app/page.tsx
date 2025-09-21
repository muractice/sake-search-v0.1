'use client';

import { useState } from 'react';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { SearchTab } from '@/features/search/SearchTab';
import { RestaurantTab } from '@/features/restaurant/RestaurantTab';
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
import { SakeData } from '@/types/sake';

export default function Home() {
  const [activeTab, setActiveTab] = useState('search');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '酒サーチ',
    message: ''
  });
  
  // カスタムフックを使用（日本酒を調べるタブ用）
  // 検索タブ用の比較リスト
  const {
    comparisonList,
    toggleComparison,
    isInComparison,
    clearComparison,
  } = useComparison();

  // 飲食店タブ専用の比較リスト
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
          title: '酒サーチ',
          message: '該当する日本酒が見つかりませんでした'
        });
      }
      // 検索結果は全て一覧表示から選択（SearchSectionで処理）
    } catch {
      setDialogState({
        isOpen: true,
        title: '酒サーチ',
        message: '検索中にエラーが発生しました'
      });
    }
  };

  const handleToggleComparison = (sake: SakeData) => {
    // 比較リストの件数チェック（最大10件）
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
      <FavoritesProvider>
        <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  酒サーチ
                </h1>
                <p className="text-lg text-slate-200">
                  日本酒の味覚を視覚化
                </p>
              </div>
              <UserProfile 
                onShowAuth={() => setShowAuthForm(true)} 
              />
            </div>
          </div>
        </header>

        {/* タブナビゲーション */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* メインコンテンツ */}
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
              &copy; 2025 酒サーチ. All rights reserved. | データ提供:
              <a href="https://sakenowa.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 ml-1">
                さけのわ
              </a>
            </p>
          </div>
        </footer>

        {/* 認証モーダル */}
        {showAuthForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAuthForm(false);
              }
            }}
          >
            <AuthForm onClose={() => setShowAuthForm(false)} />
          </div>
        )}

        {/* カスタムダイアログ */}
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
