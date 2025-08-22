'use client';

import { useState, useMemo } from 'react';
import { usePrefectureStats, PrefectureStats } from '@/hooks/usePrefectureStats';
import { getAllPrefectures } from '@/utils/prefectureMapping';

// @react-map/japanのライブラリ機能を一時的にモック（実装後に置き換え）
const JapanMapMock = ({ 
  onPrefectureClick,
  prefectureColors 
}: {
  onPrefectureClick: (prefectureName: string) => void;
  prefectureColors: { [key: string]: string };
}) => {
  const prefectures = getAllPrefectures();
  
  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🗾</div>
        <h3 className="text-lg font-semibold mb-4">都道府県マップ（開発中）</h3>
        <div className="grid grid-cols-6 gap-2 max-w-md">
          {prefectures.map(prefecture => (
            <button
              key={prefecture.id}
              onClick={() => onPrefectureClick(prefecture.name)}
              style={{ 
                backgroundColor: prefectureColors[prefecture.name] || '#e5e7eb',
                color: prefectureColors[prefecture.name] ? 'white' : 'black'
              }}
              className="px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity"
              title={prefecture.name}
            >
              {prefecture.name.replace(/[都道府県]/g, '')}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">
          実際のマップは @react-map/japan で実装予定
        </p>
      </div>
    </div>
  );
};

export const PrefectureMap = () => {
  const { prefectureStats, conquestStats, isLoading, error } = usePrefectureStats();
  const [selectedPrefecture, setSelectedPrefecture] = useState<PrefectureStats | null>(null);

  // 都道府県別の色分け（記録数に応じてグラデーション）
  const prefectureColors = useMemo(() => {
    const colors: { [key: string]: string } = {};
    
    if (prefectureStats.length === 0) return colors;

    const maxRecords = Math.max(...prefectureStats.map(stat => stat.recordCount));
    
    prefectureStats.forEach(stat => {
      const intensity = stat.recordCount / maxRecords;
      if (intensity > 0.8) {
        colors[stat.prefecture.name] = '#1e40af'; // 濃い青
      } else if (intensity > 0.6) {
        colors[stat.prefecture.name] = '#3b82f6'; // 青
      } else if (intensity > 0.4) {
        colors[stat.prefecture.name] = '#60a5fa'; // 薄い青
      } else if (intensity > 0.2) {
        colors[stat.prefecture.name] = '#93c5fd'; // より薄い青
      } else {
        colors[stat.prefecture.name] = '#dbeafe'; // 最も薄い青
      }
    });

    return colors;
  }, [prefectureStats]);

  const handlePrefectureClick = (prefectureName: string) => {
    const stat = prefectureStats.find(s => s.prefecture.name === prefectureName);
    setSelectedPrefecture(stat || null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 制覇統計 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          全国制覇状況
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {conquestStats.conqueredPrefectures}
            </div>
            <div className="text-sm text-gray-600">制覇済み</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {conquestStats.conquestRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">制覇率</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {conquestStats.totalPrefectures - conquestStats.conqueredPrefectures}
            </div>
            <div className="text-sm text-gray-600">未制覇</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {conquestStats.totalPrefectures}
            </div>
            <div className="text-sm text-gray-600">全都道府県</div>
          </div>
        </div>
      </div>

      {/* マップ */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">🗾</span>
          都道府県別飲酒記録
        </h2>
        
        <div className="mb-4">
          <div className="flex items-center space-x-4 text-sm">
            <span>記録数：</span>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>0件</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span>少</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span>中</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>多</span>
            </div>
          </div>
        </div>

        <JapanMapMock 
          onPrefectureClick={handlePrefectureClick}
          prefectureColors={prefectureColors}
        />
      </div>

      {/* 選択された都道府県の詳細 */}
      {selectedPrefecture && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">📍</span>
            {selectedPrefecture.prefecture.name}の詳細
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedPrefecture.recordCount}
              </div>
              <div className="text-sm text-gray-600">飲酒回数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedPrefecture.uniqueBrands}
              </div>
              <div className="text-sm text-gray-600">銘柄数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {selectedPrefecture.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">平均評価</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {selectedPrefecture.lastDrunkDate || '記録なし'}
              </div>
              <div className="text-sm text-gray-600">最終飲酒日</div>
            </div>
          </div>
        </div>
      )}

      {/* 上位都道府県ランキング */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">🥇</span>
          都道府県ランキング
        </h2>
        {conquestStats.topPrefectures.length > 0 ? (
          <div className="space-y-3">
            {conquestStats.topPrefectures.map((stat, index) => (
              <div 
                key={stat.prefecture.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setSelectedPrefecture(stat)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{stat.prefecture.name}</div>
                    <div className="text-sm text-gray-600">
                      {stat.uniqueBrands}銘柄 • 平均{stat.averageRating.toFixed(1)}★
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {stat.recordCount}回
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.lastDrunkDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🍶</div>
            <p>まだ記録がありません</p>
            <p className="text-sm mt-2">日本酒を記録して、都道府県制覇を目指しましょう！</p>
          </div>
        )}
      </div>

      {/* 未制覇都道府県 */}
      {conquestStats.unConqueredPrefectures.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            未制覇都道府県 ({conquestStats.unConqueredPrefectures.length}件)
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {conquestStats.unConqueredPrefectures.map(prefecture => (
              <div 
                key={prefecture.id}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm text-center hover:bg-gray-200 transition-colors"
              >
                {prefecture.name}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            これらの都道府県の日本酒を飲んで、全国制覇を目指しましょう！
          </p>
        </div>
      )}
    </div>
  );
};