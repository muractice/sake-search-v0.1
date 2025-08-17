'use client';

import { useState } from 'react';
import SearchSection from '@/components/SearchSection';
import TasteChart from '@/components/TasteChart';
// import SimpleTasteChart from '@/components/SimpleTasteChart'; // 未使用: 2025-01-17 UIシンプル化のため非表示
import SakeRadarChartSection from '@/components/SakeRadarChartSection';
// import SakeDetail from '@/components/SakeDetail'; // 未使用: 2025-01-17 詳細情報をComparisonPanelに統合
import ComparisonPanel from '@/components/ComparisonPanel';
import MenuScanner from '@/components/MenuScanner';
import { UserProfile } from '@/components/UserProfile';
import { AuthForm } from '@/components/AuthForm';
import CustomDialog from '@/components/CustomDialog';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { useComparison } from '@/hooks/useComparison';
import { useSearch } from '@/hooks/useSearch';
import { useSelection } from '@/hooks/useSelection';

export default function Home() {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showMenuScanner, setShowMenuScanner] = useState(false);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '酒サーチ',
    message: ''
  });
  
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

  // 個別追加（ダイアログなし）
  const handleIndividualAdd = async (sakeName: string) => {
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

  // 個別削除（ダイアログなし）
  const handleIndividualRemove = async (sakeName: string) => {
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
  const handleMultipleSakeFound = async (sakeNames: string[], updateStatus?: (statusMap: Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>) => void) => {
    const results = {
      added: [] as string[],
      alreadyExists: [] as string[],
      notFound: [] as string[],
      limitExceeded: [] as string[],
      errors: [] as string[]
    };

    let currentCount = comparisonList.length; // 現在の件数を追跡
    const statusMap = new Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>();

    for (const sakeName of sakeNames) {
      try {
        const searchResult = await search(sakeName);
        
        if (searchResult) {
          // 既に存在するかチェック
          if (isInComparison(searchResult.id)) {
            results.alreadyExists.push(sakeName);
            statusMap.set(sakeName, {
              status: 'added',
              message: `「${sakeName}」は既に比較リストにあります`
            });
          } else {
            // 比較リストの件数チェック（動的に追跡）
            if (currentCount >= 10) {
              results.limitExceeded.push(sakeName);
              statusMap.set(sakeName, {
                status: 'limit_exceeded',
                message: `比較リストは10件までです`
              });
            } else {
              // 検索結果を比較リストに追加
              toggleComparison(searchResult);
              results.added.push(sakeName);
              currentCount++; // 件数を増加
              statusMap.set(sakeName, {
                status: 'added',
                message: `「${sakeName}」を比較に追加しました！`
              });
            }
          }
        } else {
          results.notFound.push(sakeName);
          statusMap.set(sakeName, {
            status: 'not_found',
            message: `「${sakeName}」が見つかりませんでした`
          });
        }
      } catch {
        results.errors.push(sakeName);
        statusMap.set(sakeName, {
          status: 'not_found',
          message: 'エラーが発生しました'
        });
      }
    }

    // ステータスをスキャナーに渡す
    if (updateStatus) {
      updateStatus(statusMap);
    }

    // 結果のサマリーを表示
    let message = '';
    if (results.added.length > 0) {
      message += `✅ ${results.added.length}件追加: ${results.added.join(', ')}\n`;
    }
    if (results.alreadyExists.length > 0) {
      message += `ℹ️ ${results.alreadyExists.length}件既存: ${results.alreadyExists.join(', ')}\n`;
    }
    if (results.limitExceeded.length > 0) {
      message += `🚫 ${results.limitExceeded.length}件制限超過（10件まで）: ${results.limitExceeded.join(', ')}\n`;
    }
    if (results.notFound.length > 0) {
      message += `❌ ${results.notFound.length}件見つからず: ${results.notFound.join(', ')}\n`;
    }
    if (results.errors.length > 0) {
      message += `⚠️ ${results.errors.length}件エラー: ${results.errors.join(', ')}`;
    }
    
    if (message) {
      setDialogState({
        isOpen: true,
        title: '酒サーチ',
        message: message
      });
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
        
        {/* UserProfileをページ上部に移動 */}
        <div className="mb-8">
          <UserProfile 
            onShowAuth={() => setShowAuthForm(true)} 
            onAddToComparison={(sake) => {
              // お気に入りをクリックしたら比較リストに追加/削除を切り替え
              if (isInComparison(sake.id)) {
                // 既に比較リストにある場合は削除
                toggleComparison(sake);
              } else {
                // 比較リストにない場合は追加（件数チェック付き）
                if (comparisonList.length >= 10) {
                  setDialogState({
                    isOpen: true,
                    title: '酒サーチ',
                    message: '比較リストは10件までです。他のアイテムを削除してから追加してください。'
                  });
                  return;
                }
                toggleComparison(sake);
              }
            }}
            isInComparison={isInComparison}
            onSelectSake={selectSake}
          />
        </div>
        
        <div className="mt-8 space-y-8">
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
            
            {/* シンプル味覚チャート - 未使用: 2025-01-17 UIシンプル化のため非表示 */}
            {/* <div className="transform transition-all duration-500 hover:scale-[1.01]">
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
            </div> */}
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
            setDialogState({
              isOpen: true,
              title: '酒サーチ',
              message: result.message
            });
            return result;
          }}
          onRemoveFromComparison={async (sakeName) => {
            const result = await handleSakeRemove(sakeName);
            setDialogState({
              isOpen: true,
              title: '酒サーチ',
              message: result.message
            });
            return result;
          }}
          onMultipleSakeFound={(sakeNames, updateStatus) => handleMultipleSakeFound(sakeNames, updateStatus)}
          onIndividualAdd={handleIndividualAdd}
          onIndividualRemove={handleIndividualRemove}
          onClose={() => setShowMenuScanner(false)}
        />
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
