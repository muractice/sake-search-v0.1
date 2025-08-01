'use client';

import { useState } from 'react';
import SearchSection from '@/components/SearchSection';
import TasteChart from '@/components/TasteChart';
import SakeDetail from '@/components/SakeDetail';
import { SakeData } from '@/types/sake';

export default function Home() {
  const [currentSakeData, setCurrentSakeData] = useState<SakeData[]>([]);
  const [selectedSake, setSelectedSake] = useState<SakeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">酒サーチ</h1>
            <p className="text-lg text-gray-600">日本酒の味覚を4象限で視覚化</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchSection onSearch={handleSearch} isLoading={isLoading} />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <TasteChart 
                sakeData={currentSakeData} 
                onSakeClick={handleChartClick}
              />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-blue-900 mb-4">詳細情報</h2>
              {selectedSake ? (
                <SakeDetail sake={selectedSake} />
              ) : (
                <p className="text-gray-500 text-center py-8">
                  日本酒を検索すると、ここに詳細情報が表示されます
                </p>
              )}
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
