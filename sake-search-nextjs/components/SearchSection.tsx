'use client';

import { useState } from 'react';

interface SearchSectionProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchSection({ onSearch, isLoading }: SearchSectionProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="日本酒名を入力してください（例：獺祭、八海山、久保田）"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
        >
          {isLoading ? '検索中...' : '検索'}
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>試してみる: 獺祭、八海山、久保田、十四代、而今、新政、田酒、鍋島、黒龍、飛露喜</p>
      </div>
    </div>
  );
}