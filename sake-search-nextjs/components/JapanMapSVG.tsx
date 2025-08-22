'use client';

import { useState, useMemo } from 'react';
import Japan from '@react-map/japan';

interface JapanMapSVGProps {
  prefectureStats: { [key: string]: number }; // 都道府県名 -> 記録数
  onPrefectureClick: (prefectureName: string) => void;
}

export const JapanMapSVG = ({ prefectureStats, onPrefectureClick }: JapanMapSVGProps) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  // 記録数に基づく色分け設定
  const getColorForPrefecture = (prefectureName: string) => {
    const count = prefectureStats[prefectureName] || 0;
    
    if (count === 0) return '#e5e7eb'; // gray-200 - 記録なし
    
    // 最大記録数を取得
    const maxCount = Math.max(...Object.values(prefectureStats));
    const intensity = count / maxCount;
    
    // 青のグラデーション
    if (intensity > 0.8) return '#1e40af'; // blue-800 - とても多い
    if (intensity > 0.6) return '#2563eb'; // blue-600 - 多い
    if (intensity > 0.4) return '#3b82f6'; // blue-500 - 普通
    if (intensity > 0.2) return '#60a5fa'; // blue-400 - 少し
    return '#93c5fd'; // blue-300 - 少ない
  };

  // 都道府県名の正規化（@react-map/japanの形式に合わせる）
  const normalizePrefectureName = (name: string): string => {
    return name.replace(/[都道府県]/g, '');
  };

  // マップの設定
  const mapConfig = useMemo(() => {
    const config: { [key: string]: any } = {};
    
    Object.keys(prefectureStats).forEach(prefectureName => {
      const normalizedName = normalizePrefectureName(prefectureName);
      const color = getColorForPrefecture(prefectureName);
      
      config[normalizedName] = {
        fill: color,
        stroke: '#374151', // gray-700
        strokeWidth: 1,
        cursor: 'pointer',
      };
    });
    
    return config;
  }, [prefectureStats]);

  const handlePrefectureClick = (prefectureId: string) => {
    // prefectureIdを都道府県名に変換（必要に応じて調整）
    const prefectureName = prefectureId + '県'; // 簡易実装
    onPrefectureClick(prefectureName);
  };

  const handlePrefectureHover = (prefectureId: string) => {
    setHoveredPrefecture(prefectureId);
  };

  const handlePrefectureLeave = () => {
    setHoveredPrefecture(null);
  };

  return (
    <div className="relative">
      {/* 地図本体 */}
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg border">
        <Japan
          onClick={handlePrefectureClick}
          onHover={handlePrefectureHover}
          onLeave={handlePrefectureLeave}
          config={mapConfig}
          className="max-w-full max-h-full"
        />
      </div>

      {/* ホバー時の情報表示 */}
      {hoveredPrefecture && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
          <div className="font-semibold">{hoveredPrefecture}県</div>
          <div>記録数: {prefectureStats[hoveredPrefecture + '県'] || 0}件</div>
        </div>
      )}

      {/* 凡例 */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
        <span>記録数：</span>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
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