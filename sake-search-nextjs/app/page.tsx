'use client';

import { useState } from 'react';
import SearchSection from '@/components/SearchSection';
import TasteChart from '@/components/TasteChart';
import SakeDetail from '@/components/SakeDetail';
import ComparisonPanel from '@/components/ComparisonPanel';
import { SakeData } from '@/types/sake';
import { useComparison } from '@/hooks/useComparison';

export default function Home() {
  const [currentSakeData, setCurrentSakeData] = useState<SakeData[]>([]);
  const [selectedSake, setSelectedSake] = useState<SakeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // カスタムフックを使用
  const {
    comparisonList,
    isComparisonMode,
    toggleComparison,
    isInComparison,
    clearComparison,
    toggleComparisonMode,
  } = useComparison();

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && data.results.length > 0) {
        setCurrentSakeData(data.results);
        setSelectedSake(data.results[0]);
      } else {
        setCurrentSakeData([]);
        setSelectedSake(null);
        alert('該当する日本酒が見つかりませんでした');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('検索中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChartClick = (sake: SakeData) => {
    setSelectedSake(sake);
  };


  return (
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
        <SearchSection onSearch={handleSearch} isLoading={isLoading} />
        
        <ComparisonPanel
          comparisonList={comparisonList}
          isComparisonMode={isComparisonMode}
          onToggleMode={toggleComparisonMode}
          onRemove={toggleComparison}
          onClear={clearComparison}
        />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 transform transition-all duration-500 hover:scale-[1.01]">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300">
              {(isComparisonMode ? comparisonList : currentSakeData).length > 0 ? (
                <div className="animate-slide-up">
                  <TasteChart 
                    sakeData={isComparisonMode ? comparisonList : currentSakeData} 
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
          
          <div className="lg:col-span-1 transform transition-all duration-500 hover:scale-[1.01]">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                詳細情報
              </h2>
              <div className="transition-all duration-500 ease-in-out">
                {selectedSake ? (
                  <div className="animate-fade-in">
                    <SakeDetail 
                      sake={selectedSake}
                      onCompare={toggleComparison}
                      isInComparison={isInComparison(selectedSake.id)}
                      showCompareButton={isComparisonMode}
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
    </div>
  );
}
