'use client';

import { useState } from 'react';
import { JapanMapPaths } from '@/utils/japanMapPaths';

interface JapanActualMapProps {
  prefectureStats: { [key: string]: number };
  onPrefectureClick: (prefectureName: string) => void;
}

export const JapanActualMap = ({ prefectureStats, onPrefectureClick }: JapanActualMapProps) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  // 記録数に基づく色を取得
  const getColorForPrefecture = (prefectureName: string) => {
    const count = prefectureStats[prefectureName] || 0;
    
    if (count === 0) return '#e5e7eb'; // gray-200 - 未記録
    
    // 緑のグラデーション（達成度に応じて）
    if (count >= 10) return '#15803d'; // green-700 - とても多い
    if (count >= 5) return '#16a34a'; // green-600 - 多い
    if (count >= 3) return '#22c55e'; // green-500 - 普通
    if (count >= 1) return '#4ade80'; // green-400 - 少ない
    return '#86efac'; // green-300 - わずか
  };

  const handleMouseEnter = (prefectureName: string) => {
    setHoveredPrefecture(prefectureName);
  };

  const handleMouseLeave = () => {
    setHoveredPrefecture(null);
  };

  const handleClick = (prefectureName: string) => {
    onPrefectureClick(prefectureName);
  };

  // 記録がある都道府県の数を計算
  const conqueredCount = Object.keys(prefectureStats).filter(p => prefectureStats[p] > 0).length;
  const conquestRate = Math.round((conqueredCount / 47) * 100);

  return (
    <div className="relative">
      {/* タイトルと達成度 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">日本酒マップ</h3>
        <div className="text-sm text-gray-600">
          達成度：{conqueredCount} / 47 ({conquestRate}%)
        </div>
      </div>

      {/* 日本地図SVG */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <svg 
          viewBox="0 0 800 600" 
          className="w-full h-auto max-w-2xl mx-auto"
        >
          {JapanMapPaths.map(({ name, path }) => {
            const color = getColorForPrefecture(name);
            const count = prefectureStats[name] || 0;
            const isHovered = hoveredPrefecture === name;

            return (
              <g key={name}>
                <path
                  d={path}
                  fill={color}
                  stroke="#666"
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  opacity={isHovered ? 0.9 : 1}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                  }}
                  onMouseEnter={() => handleMouseEnter(name)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(name)}
                >
                  <title>{name}: {count}銘柄</title>
                </path>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ホバー時の詳細情報 */}
      {hoveredPrefecture && (
        <div className="absolute top-20 left-4 bg-white shadow-xl px-4 py-3 rounded-lg border z-20">
          <div className="font-bold text-gray-900">{hoveredPrefecture}</div>
          <div className="text-sm text-gray-600 mt-1">
            飲んだ種類: <span className="font-semibold text-green-600">
              {prefectureStats[hoveredPrefecture] || 0}銘柄
            </span>
          </div>
        </div>
      )}

      {/* ランキング表示（左側） */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-bold mb-2 text-gray-700">銘柄ごとの飲んだ回数</h4>
          <div className="space-y-1">
            {Object.entries(prefectureStats)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count], index) => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </span>
                  <span className="flex-1">{name}</span>
                  <div className="flex items-center gap-1">
                    <div className="h-2 bg-green-500 rounded" style={{ width: `${(count / Math.max(...Object.values(prefectureStats))) * 100}px` }}></div>
                    <span className="text-gray-600">{count}回</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 凡例（右側） */}
        <div>
          <h4 className="text-sm font-bold mb-2 text-gray-700">凡例</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e5e7eb' }}></div>
              <span>未記録</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#86efac' }}></div>
              <span>1-2銘柄</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span>3-4銘柄</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }}></div>
              <span>5-9銘柄</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#15803d' }}></div>
              <span>10銘柄以上</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};