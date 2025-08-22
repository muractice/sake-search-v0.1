'use client';

import { useState } from 'react';

interface SimpleJapanMapProps {
  prefectureStats: { [key: string]: number }; // 都道府県名 -> 記録数
  onPrefectureClick: (prefectureName: string) => void;
}

export const SimpleJapanMap = ({ prefectureStats, onPrefectureClick }: SimpleJapanMapProps) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  // 記録数に基づく色分け
  const getColorForPrefecture = (prefectureName: string) => {
    const count = prefectureStats[prefectureName] || 0;
    
    if (count === 0) return '#e5e7eb'; // gray-200 - 記録なし
    
    // 最大記録数を取得
    const maxCount = Math.max(...Object.values(prefectureStats));
    if (maxCount === 0) return '#e5e7eb';
    
    const intensity = count / maxCount;
    
    // 青のグラデーション
    if (intensity > 0.8) return '#1e40af'; // blue-800
    if (intensity > 0.6) return '#2563eb'; // blue-600
    if (intensity > 0.4) return '#3b82f6'; // blue-500
    if (intensity > 0.2) return '#60a5fa'; // blue-400
    return '#93c5fd'; // blue-300
  };

  // 都道府県のグリッド配置（簡易版）
  const prefectureGrid = [
    // 北海道・東北
    [
      { name: '北海道', x: 2, y: 0 },
      { name: '青森県', x: 2, y: 1 },
      { name: '岩手県', x: 3, y: 1 },
      { name: '宮城県', x: 3, y: 2 },
      { name: '秋田県', x: 2, y: 2 },
      { name: '山形県', x: 2, y: 3 },
      { name: '福島県', x: 3, y: 3 },
    ],
    // 関東
    [
      { name: '茨城県', x: 4, y: 3 },
      { name: '栃木県', x: 4, y: 2 },
      { name: '群馬県', x: 3, y: 4 },
      { name: '埼玉県', x: 4, y: 4 },
      { name: '千葉県', x: 5, y: 4 },
      { name: '東京都', x: 4, y: 5 },
      { name: '神奈川県', x: 4, y: 6 },
    ],
    // 中部
    [
      { name: '新潟県', x: 2, y: 4 },
      { name: '富山県', x: 2, y: 5 },
      { name: '石川県', x: 1, y: 5 },
      { name: '福井県', x: 1, y: 6 },
      { name: '山梨県', x: 3, y: 5 },
      { name: '長野県', x: 3, y: 6 },
      { name: '岐阜県', x: 2, y: 6 },
      { name: '静岡県', x: 3, y: 7 },
      { name: '愛知県', x: 2, y: 7 },
    ],
    // 関西
    [
      { name: '三重県', x: 2, y: 8 },
      { name: '滋賀県', x: 1, y: 7 },
      { name: '京都府', x: 1, y: 8 },
      { name: '大阪府', x: 1, y: 9 },
      { name: '兵庫県', x: 0, y: 9 },
      { name: '奈良県', x: 2, y: 9 },
      { name: '和歌山県', x: 2, y: 10 },
    ],
    // 中国・四国
    [
      { name: '鳥取県', x: 0, y: 8 },
      { name: '島根県', x: 0, y: 7 },
      { name: '岡山県', x: 0, y: 10 },
      { name: '広島県', x: 0, y: 11 },
      { name: '山口県', x: 0, y: 12 },
      { name: '徳島県', x: 1, y: 10 },
      { name: '香川県', x: 1, y: 11 },
      { name: '愛媛県', x: 0, y: 13 },
      { name: '高知県', x: 1, y: 12 },
    ],
    // 九州・沖縄
    [
      { name: '福岡県', x: 0, y: 14 },
      { name: '佐賀県', x: 0, y: 15 },
      { name: '長崎県', x: 0, y: 16 },
      { name: '熊本県', x: 1, y: 15 },
      { name: '大分県', x: 1, y: 14 },
      { name: '宮崎県', x: 2, y: 15 },
      { name: '鹿児島県', x: 1, y: 16 },
      { name: '沖縄県', x: 0, y: 18 },
    ],
  ].flat();

  const handlePrefectureClick = (prefectureName: string) => {
    onPrefectureClick(prefectureName);
  };

  const handlePrefectureHover = (prefectureName: string) => {
    setHoveredPrefecture(prefectureName);
  };

  const handlePrefectureLeave = () => {
    setHoveredPrefecture(null);
  };

  return (
    <div className="relative">
      {/* 地図本体 */}
      <div className="w-full bg-gray-50 rounded-lg border p-4">
        <div className="grid grid-cols-6 gap-1 max-w-2xl mx-auto">
          {Array.from({ length: 6 * 20 }, (_, index) => {
            const x = index % 6;
            const y = Math.floor(index / 6);
            const prefecture = prefectureGrid.find(p => p.x === x && p.y === y);
            
            if (!prefecture) {
              return <div key={index} className="h-8"></div>;
            }
            
            const color = getColorForPrefecture(prefecture.name);
            const recordCount = prefectureStats[prefecture.name] || 0;
            
            return (
              <button
                key={prefecture.name}
                onClick={() => handlePrefectureClick(prefecture.name)}
                onMouseEnter={() => handlePrefectureHover(prefecture.name)}
                onMouseLeave={handlePrefectureLeave}
                style={{ backgroundColor: color }}
                className={`
                  h-8 text-xs font-medium rounded border border-gray-300
                  hover:opacity-80 transition-all duration-200 transform hover:scale-105
                  ${recordCount > 0 ? 'text-white' : 'text-gray-700'}
                  shadow-sm hover:shadow-md
                `}
                title={`${prefecture.name}: ${recordCount}件`}
              >
                {prefecture.name.replace(/[都道府県]/g, '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* ホバー時の詳細情報 */}
      {hoveredPrefecture && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-10">
          <div className="font-bold">{hoveredPrefecture}</div>
          <div>記録数: {prefectureStats[hoveredPrefecture] || 0}件</div>
        </div>
      )}

      {/* 凡例 */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
        <span className="font-medium">記録数：</span>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded border"></div>
          <span>0件</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-300 rounded"></div>
          <span>少</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>中</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-800 rounded"></div>
          <span>多</span>
        </div>
      </div>
    </div>
  );
};