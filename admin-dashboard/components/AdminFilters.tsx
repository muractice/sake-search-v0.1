'use client';

interface AdminFiltersProps {
  prefectures: string[];
  breweries: string[];
  selectedPrefecture: string;
  selectedBrewery: string;
  onPrefectureChange: (prefecture: string) => void;
  onBreweryChange: (brewery: string) => void;
  totalCount: number;
  filteredCount: number;
}

export default function AdminFilters({
  prefectures,
  breweries,
  selectedPrefecture,
  selectedBrewery,
  onPrefectureChange,
  onBreweryChange,
  totalCount,
  filteredCount,
}: AdminFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        フィルター
      </h2>
      
      {/* データ件数表示 */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">
          表示中: <span className="font-bold text-gray-900">{filteredCount}</span> / {totalCount} 件
        </div>
        {selectedPrefecture || selectedBrewery ? (
          <button
            onClick={() => {
              onPrefectureChange('');
              onBreweryChange('');
            }}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            フィルターをクリア
          </button>
        ) : null}
      </div>

      {/* 都道府県フィルター */}
      <div className="mb-6">
        <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
          都道府県
        </label>
        <select
          id="prefecture"
          value={selectedPrefecture}
          onChange={(e) => onPrefectureChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">すべての都道府県</option>
          {prefectures.map((prefecture) => (
            <option key={prefecture} value={prefecture}>
              {prefecture}
            </option>
          ))}
        </select>
      </div>

      {/* 酒蔵フィルター */}
      <div className="mb-6">
        <label htmlFor="brewery" className="block text-sm font-medium text-gray-700 mb-2">
          酒蔵
        </label>
        <select
          id="brewery"
          value={selectedBrewery}
          onChange={(e) => onBreweryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">すべての酒蔵</option>
          {breweries.map((brewery) => (
            <option key={brewery} value={brewery}>
              {brewery}
            </option>
          ))}
        </select>
      </div>

      {/* 追加フィルター（将来実装用） */}
      <div className="border-t pt-4 mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          追加フィルター（開発中）
        </h3>
        <div className="space-y-3">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              className="mr-2 rounded border-gray-300"
              disabled
            />
            データが不完全なものを除外
          </label>
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              className="mr-2 rounded border-gray-300"
              disabled
            />
            外れ値を除外
          </label>
        </div>
      </div>

      {/* データエクスポート（将来実装用） */}
      <div className="border-t pt-4 mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          データエクスポート
        </h3>
        <button
          className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
          disabled
        >
          CSVでダウンロード（開発中）
        </button>
      </div>
    </div>
  );
}