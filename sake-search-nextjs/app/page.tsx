'use client';

import { useState } from 'react';
import { TabNavigation } from '@/components/TabNavigation';
import { SearchTab } from '@/components/tabs/SearchTab';
import { RestaurantTab } from '@/components/tabs/RestaurantTab';
import { FavoritesTab } from '@/components/tabs/FavoritesTab';
import { UserProfile } from '@/components/UserProfile';
import { AuthForm } from '@/components/AuthForm';
import CustomDialog from '@/components/CustomDialog';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { useComparison } from '@/hooks/useComparison';
import { useSearch } from '@/hooks/useSearch';
import { useSelection } from '@/hooks/useSelection';
import { SakeData } from '@/types/sake';

export default function Home() {
  const [activeTab, setActiveTab] = useState('search');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '酒サーチ',
    message: ''
  });
  
  // カスタムフックを使用（日本酒を調べるタブ用）
  const {
    comparisonList,
    toggleComparison,
    isInComparison,
    clearComparison,
  } = useComparison();
  
  // 飲食店タブ用の独立した比較リスト
  const {
    comparisonList: restaurantComparisonList,
    toggleComparison: toggleRestaurantComparison,
    isInComparison: isInRestaurantComparison,
    clearComparison: clearRestaurantComparison,
  } = useComparison();

  const {
    isLoading,
    search,
  } = useSearch();

  const {
    selectSake,
    handleChartClick,
  } = useSelection();

  const handleSearch = async (query: string) => {
    try {
      const searchResult = await search(query);
      selectSake(searchResult);
      
      if (!searchResult) {
        setDialogState({
          isOpen: true,
          title: '酒サーチ',
          message: '該当する日本酒が見つかりませんでした'
        });
      } else {
        // 検索結果を自動的に比較リストに追加（既に存在しない場合のみ）
        if (!isInComparison(searchResult.id)) {
          toggleComparison(searchResult);
        }
      }
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
    <FavoritesProvider>
      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  酒サーチ
                </h1>
                <p className="text-lg text-blue-100">
                  日本酒の味覚を視覚化
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <UserProfile 
                  onShowAuth={() => setShowAuthForm(true)} 
                  onAddToComparison={handleToggleComparison}
                  isInComparison={isInComparison}
                  onSelectSake={selectSake}
                />
              </div>
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
              comparisonList={comparisonList}
              onToggleComparison={handleToggleComparison}
              isInComparison={isInComparison}
              onClearComparison={clearComparison}
              onSelectSake={selectSake}
              onChartClick={handleChartClick}
            />
          )}

          {activeTab === 'restaurant' && (
            <RestaurantTab
              comparisonList={restaurantComparisonList}
              onToggleComparison={toggleRestaurantComparison}
              isInComparison={isInRestaurantComparison}
              onClearComparison={clearRestaurantComparison}
              onSelectSake={selectSake}
              onChartClick={handleChartClick}
              onSearch={search}
              menuItems={menuItems}
              onMenuItemsChange={setMenuItems}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritesTab
              onSelectSake={selectSake}
              onToggleComparison={handleToggleComparison}
              isInComparison={isInComparison}
            />
          )}
        </main>

        {/* フッター */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-600">
              &copy; 2025 酒サーチ. All rights reserved. | データ提供: 
              <a href="https://sakenowa.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
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
  );
}