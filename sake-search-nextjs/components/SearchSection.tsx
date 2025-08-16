'use client';

import { useState } from 'react';

interface SearchSectionProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  onShowMenuScanner?: () => void;
}

export default function SearchSection({ onSearch, isLoading, onShowMenuScanner }: SearchSectionProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSakeNameClick = (sakeName: string) => {
    setQuery(sakeName);
    onSearch(sakeName);
  };

  const sakeNames = ['獺祭', '八海山', '伯楽星', '十四代', '而今', '新政', '田酒', '鍋島', '黒龍', '飛露喜'];

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-4 sm:p-6 transition-all duration-300 animate-slide-down">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="日本酒名を入力してください（例：獺祭、八海山、伯楽星）"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg text-gray-900 bg-white transition-all duration-300 hover:border-blue-400 focus:scale-[1.01] placeholder-gray-500"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-base sm:text-lg transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  検索中...
                </>
              ) : (
                <>
                  🔍 検索
                </>
              )}
            </span>
          </button>
          
          {onShowMenuScanner && (
            <button
              type="button"
              onClick={onShowMenuScanner}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 text-base sm:text-lg transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="sm:hidden">📷</span>
                <span className="hidden sm:inline">📷 メニューをスキャン</span>
              </span>
            </button>
          )}
        </div>
      </form>
      
      <div className="mt-4 text-sm text-gray-700 animate-fade-in-delay">
        <p className="mb-2 font-medium">💡 試してみる:</p>
        <div className="flex flex-wrap gap-2">
          {sakeNames.map((sakeName) => (
            <button
              key={sakeName}
              onClick={() => handleSakeNameClick(sakeName)}
              className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 hover:text-blue-900 transition-all duration-200 cursor-pointer border border-blue-300 hover:border-blue-400 transform hover:scale-105 shadow-sm hover:shadow-md"
              type="button"
            >
              {sakeName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}