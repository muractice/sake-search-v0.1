'use client';

import { useState } from 'react';
import SearchSection from '@/components/SearchSection';
import TasteChart from '@/components/TasteChart';
import SimpleTasteChart from '@/components/SimpleTasteChart';
import SakeRadarChartSection from '@/components/SakeRadarChartSection';
import SakeDetail from '@/components/SakeDetail';
import ComparisonPanel from '@/components/ComparisonPanel';
import MenuScanner from '@/components/MenuScanner';
import { UserProfile } from '@/components/UserProfile';
import { AuthForm } from '@/components/AuthForm';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { useComparison } from '@/hooks/useComparison';
import { useSearch } from '@/hooks/useSearch';
import { useSelection } from '@/hooks/useSelection';

export default function Home() {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showMenuScanner, setShowMenuScanner] = useState(false);
  
  // カスタムフックを使用
  const {
    comparisonList,
    toggleComparison,
    isInComparison,
    clearComparison,
  } = useComparison();

  const {
    isLoading,
    search,
  } = useSearch();

  const {
    selectedSake,
    selectSake,
    handleChartClick,
  } = useSelection();

  const handleSearch = async (query: string) => {
    try {
      const searchResult = await search(query);
      selectSake(searchResult);
      
      if (!searchResult) {
        alert('該当する日本酒が見つかりませんでした');
      } else {
        // 検索結果を自動的に比較リストに追加（既に存在しない場合のみ）
        if (!isInComparison(searchResult.id)) {
          toggleComparison(searchResult);
        }
      }
    } catch {
      alert('検索中にエラーが発生しました');
    }
  };

  // メニューから見つかった日本酒を処理
  const handleSakeFound = async (sakeName: string) => {
    try {
      const searchResult = await search(sakeName);
      
      if (searchResult) {
        // 比較リストの件数チェック（最大10件）
        if (comparisonList.length >= 10 && !isInComparison(searchResult.id)) {
          return { success: false, message: `比較リストは10件までです。他のアイテムを削除してから追加してください` };
        }
        
        // 検索結果を比較リストに追加（既に存在しない場合のみ）
        if (!isInComparison(searchResult.id)) {
          toggleComparison(searchResult);
          return { success: true, message: `「${sakeName}」を比較に追加しました！` };
        } else {
          return { success: false, message: `「${sakeName}」は既に比較リストにあります` };
        }
      } else {
        return { success: false, message: `「${sakeName}」が見つかりませんでした` };
      }
    } catch {
      return { success: false, message: '検索中にエラーが発生しました' };
    }
  };

  // 比較リストから日本酒を削除
  const handleSakeRemove = async (sakeName: string) => {
    try {
      const searchResult = await search(sakeName);
      
      if (searchResult && isInComparison(searchResult.id)) {
        toggleComparison(searchResult);
        return { success: true, message: `「${sakeName}」を比較リストから削除しました` };
      } else {
        return { success: false, message: `「${sakeName}」は比較リストにありません` };
      }
    } catch {
      return { success: false, message: '削除中にエラーが発生しました' };
    }
  };

  // 複数の日本酒を一括処理
  const handleMultipleSakeFound = async (sakeNames: string[]) => {
    const results = {
      added: [] as string[],
      alreadyExists: [] as string[],
      notFound: [] as string[],
      errors: [] as string[]
    };

    for (const sakeName of sakeNames) {
      const result = await handleSakeFound(sakeName);
      if (result.success && result.message.includes('追加しました')) {
        results.added.push(sakeName);
      } else if (result.message.includes('既に比較リストにあります')) {
        results.alreadyExists.push(sakeName);
      } else if (result.message.includes('見つかりませんでした')) {
        results.notFound.push(sakeName);
      } else {
        results.errors.push(sakeName);
      }
    }

    // 結果のサマリーを表示
    let message = '';
    if (results.added.length > 0) {
      message += `✅ ${results.added.length}件追加: ${results.added.join(', ')}\n`;
    }
    if (results.alreadyExists.length > 0) {
      message += `ℹ️ ${results.alreadyExists.length}件既存: ${results.alreadyExists.join(', ')}\n`;
    }
    if (results.notFound.length > 0) {
      message += `❌ ${results.notFound.length}件見つからず: ${results.notFound.join(', ')}\n`;
    }
    if (results.errors.length > 0) {
      message += `⚠️ ${results.errors.length}件エラー: ${results.errors.join(', ')}`;
    }
    
    if (message) {
      alert(message);
    }
  };

  return (
    <FavoritesProvider>
      <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg animate-fade-in">
              酒サーチ
            </h1>
            <p className="text-xl text-blue-100 animate-fade-in-delay">
              日本酒の味覚を4象限で視覚化
            </p>
            <div className="mt-4 flex justify-center">
              <div className="w-16 h-1 bg-gradient-to-r from-pink-300 to-blue-300 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchSection 
          onSearch={handleSearch} 
          isLoading={isLoading}
          onShowMenuScanner={() => setShowMenuScanner(true)}
        />
        
        <ComparisonPanel
          comparisonList={comparisonList}
          onRemove={toggleComparison}
          onClear={clearComparison}
          onSelectSake={selectSake}
        />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* 既存の4象限チャート */}
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  4象限味覚チャート
                </h2>
                {comparisonList.length > 0 ? (
                  <div className="animate-slide-up">
                    <TasteChart 
                      sakeData={comparisonList} 
                      onSakeClick={handleChartClick}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-400 animate-pulse">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🍶</div>
                      <p className="text-lg">日本酒を検索してチャートを表示</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* レーダーチャートセクション */}
            <SakeRadarChartSection sakeData={comparisonList} />
            
            {/* 新しいシンプルチャート */}
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300">
                <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  シンプル味覚チャート（辛甘×淡濃）
                </h2>
                {comparisonList.length > 0 ? (
                  <div className="animate-slide-up">
                    <SimpleTasteChart 
                      sakeData={comparisonList} 
                      onSakeClick={handleChartClick}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-400 animate-pulse">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📊</div>
                      <p className="text-lg">日本酒を検索してチャートを表示</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <UserProfile 
                onShowAuth={() => setShowAuthForm(true)} 
                onAddToComparison={(sake) => {
                  // お気に入りをクリックしたら比較リストに追加、件数チェック付き
                  if (comparisonList.length >= 10 && !isInComparison(sake.id)) {
                    alert('比較リストは10件までです。他のアイテムを削除してから追加してください。');
                    return;
                  }
                  
                  if (!isInComparison(sake.id)) {
                    toggleComparison(sake);
                    alert(`「${sake.name}」を比較リストに追加しました！`);
                  } else {
                    alert(`「${sake.name}」は既に比較リストにあります。`);
                  }
                }}
                isInComparison={isInComparison}
                onSelectSake={selectSake}
              />
            </div>
            
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  詳細情報
                </h2>
                <div className="transition-all duration-500 ease-in-out">
                  {selectedSake ? (
                    <div className="animate-fade-in">
                      <SakeDetail 
                        sake={selectedSake}
                        onCompare={(sake) => {
                          // 詳細情報の比較ボタンも件数チェック付き
                          if (comparisonList.length >= 10 && !isInComparison(sake.id)) {
                            alert('比較リストは10件までです。他のアイテムを削除してから追加してください。');
                            return;
                          }
                          
                          toggleComparison(sake);
                          
                          if (!isInComparison(sake.id)) {
                            alert(`「${sake.name}」を比較リストに追加しました！`);
                          } else {
                            alert(`「${sake.name}」を比較リストから削除しました。`);
                          }
                        }}
                        isInComparison={isInComparison(selectedSake.id)}
                        showCompareButton={true}
                      />
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8 animate-pulse">
                      <div className="text-4xl mb-4">📊</div>
                      <p>日本酒を検索すると、ここに詳細情報が表示されます</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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

      {/* メニュースキャナーモーダル */}
      {showMenuScanner && (
        <MenuScanner
          onSakeFound={async (sakeName) => {
            const result = await handleSakeFound(sakeName);
            alert(result.message);
            return result;
          }}
          onRemoveFromComparison={async (sakeName) => {
            const result = await handleSakeRemove(sakeName);
            alert(result.message);
            return result;
          }}
          onMultipleSakeFound={handleMultipleSakeFound}
          onClose={() => setShowMenuScanner(false)}
        />
      )}
      </div>
    </FavoritesProvider>
  );
}
