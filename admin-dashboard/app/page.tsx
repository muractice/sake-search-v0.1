'use client';

import { useState, useEffect } from 'react';
import AdminChart from '@/components/AdminChart';
import AdminFilters from '@/components/AdminFilters';
import AdminStats from '@/components/AdminStats';

interface AdminSakeData {
  id: number;
  brandId: number;
  name: string;
  breweryId: number;
  breweryName: string;
  prefecture?: string;
  sweetness: number;
  richness: number;
  originalData: {
    f1: number;
    f2: number;
    f3: number;
    f4: number;
    f5: number;
    f6: number;
  };
}

export default function AdminDashboard() {
  const [allSakeData, setAllSakeData] = useState<AdminSakeData[]>([]);
  const [filteredData, setFilteredData] = useState<AdminSakeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('');
  const [selectedBrewery, setSelectedBrewery] = useState<string>('');
  
  // 補正値（将来的に使用）
  const [sweetnessOffset, setSweetnessOffset] = useState(0);
  const [richnessOffset, setRichnessOffset] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sake-data');
      const data = await response.json();
      setAllSakeData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Failed to fetch sake data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = allSakeData;

    if (selectedPrefecture) {
      filtered = filtered.filter(sake => sake.prefecture === selectedPrefecture);
    }

    if (selectedBrewery) {
      filtered = filtered.filter(sake => sake.breweryName === selectedBrewery);
    }

    setFilteredData(filtered);
  }, [selectedPrefecture, selectedBrewery, allSakeData]);

  // 都道府県と酒蔵のリストを取得
  const prefectures = [...new Set(allSakeData.map(sake => sake.prefecture).filter(Boolean))].sort();
  const breweries = [...new Set(allSakeData.map(sake => sake.breweryName).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          日本酒データ管理画面
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左サイドバー: フィルタ */}
          <div className="lg:col-span-3">
            <AdminFilters
              prefectures={prefectures}
              breweries={breweries}
              selectedPrefecture={selectedPrefecture}
              selectedBrewery={selectedBrewery}
              onPrefectureChange={setSelectedPrefecture}
              onBreweryChange={setSelectedBrewery}
              totalCount={allSakeData.length}
              filteredCount={filteredData.length}
            />

            {/* 補正値設定（将来実装用のUI） */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                座標補正値（開発中）
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    甘辛度補正
                  </label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={sweetnessOffset}
                    onChange={(e) => setSweetnessOffset(Number(e.target.value))}
                    className="w-full"
                    disabled
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    現在: {sweetnessOffset}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    淡濃度補正
                  </label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={richnessOffset}
                    onChange={(e) => setRichnessOffset(Number(e.target.value))}
                    className="w-full"
                    disabled
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    現在: {richnessOffset}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-9">
            {/* 統計情報 */}
            <AdminStats sakeData={filteredData} />

            {/* チャート */}
            <div className="mt-6">
              <AdminChart 
                sakeData={filteredData}
                sweetnessOffset={sweetnessOffset}
                richnessOffset={richnessOffset}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}