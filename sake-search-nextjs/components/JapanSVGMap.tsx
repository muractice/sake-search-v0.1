'use client';

import { useState, useMemo } from 'react';

interface JapanSVGMapProps {
  prefectureStats: { [key: string]: number };
  onPrefectureClick: (prefectureName: string) => void;
}

export const JapanSVGMap = ({ prefectureStats, onPrefectureClick }: JapanSVGMapProps) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  // 記録数に基づく色を取得
  const getColorForPrefecture = (prefectureName: string) => {
    const count = prefectureStats[prefectureName] || 0;
    
    if (count === 0) return '#e5e7eb'; // gray-200
    
    // 色の濃さを段階的に設定
    if (count >= 10) return '#16a34a'; // green-600 - 濃い緑
    if (count >= 5) return '#22c55e'; // green-500
    if (count >= 3) return '#4ade80'; // green-400
    if (count >= 1) return '#86efac'; // green-300
    return '#bbf7d0'; // green-200
  };

  // 都道府県の塗りつぶしスタイルを生成
  const prefectureStyles = useMemo(() => {
    const styles: { [key: string]: React.CSSProperties } = {};
    
    Object.keys(prefectureStats).forEach(prefName => {
      styles[prefName] = {
        fill: getColorForPrefecture(prefName),
        stroke: '#374151',
        strokeWidth: 0.5,
        cursor: 'pointer',
        transition: 'all 0.2s',
      };
    });
    
    // デフォルトスタイル（記録がない都道府県用）
    const allPrefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
      '岐阜県', '静岡県', '愛知県', '三重県',
      '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
      '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県',
      '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];
    
    allPrefectures.forEach(prefName => {
      if (!styles[prefName]) {
        styles[prefName] = {
          fill: '#e5e7eb',
          stroke: '#9ca3af',
          strokeWidth: 0.5,
          cursor: 'pointer',
          transition: 'all 0.2s',
        };
      }
    });
    
    return styles;
  }, [prefectureStats]);

  const handleMouseEnter = (prefectureName: string) => {
    setHoveredPrefecture(prefectureName);
  };

  const handleMouseLeave = () => {
    setHoveredPrefecture(null);
  };

  const handleClick = (prefectureName: string) => {
    onPrefectureClick(prefectureName);
  };

  // SVGパスデータ（簡略版 - 実際のプロジェクトでは詳細なパスデータを使用）
  // ここでは例として主要な都道府県のみ定義
  const prefecturePaths = {
    '北海道': 'M 400 50 L 450 50 L 470 80 L 450 120 L 400 110 L 380 80 Z',
    '青森県': 'M 400 130 L 430 130 L 430 160 L 400 160 Z',
    '岩手県': 'M 430 130 L 460 130 L 460 170 L 430 170 Z',
    '宮城県': 'M 430 170 L 460 170 L 460 200 L 430 200 Z',
    '秋田県': 'M 400 160 L 430 160 L 430 200 L 400 200 Z',
    '山形県': 'M 400 200 L 430 200 L 430 230 L 400 230 Z',
    '福島県': 'M 430 200 L 470 200 L 470 230 L 430 230 Z',
    '新潟県': 'M 370 230 L 400 230 L 400 270 L 370 270 Z',
    '東京都': 'M 420 320 L 450 320 L 450 340 L 420 340 Z',
    '神奈川県': 'M 420 340 L 450 340 L 450 360 L 420 360 Z',
    // ... 他の都道府県も同様に定義
  };

  return (
    <div className="relative w-full">
      {/* 日本地図SVG */}
      <svg 
        viewBox="0 0 600 700" 
        className="w-full h-auto max-w-2xl mx-auto"
        style={{ backgroundColor: '#f3f4f6' }}
      >
        {/* 実際の日本地図の簡略版 */}
        {Object.entries(prefecturePaths).map(([prefName, path]) => (
          <path
            key={prefName}
            d={path}
            style={{
              ...prefectureStyles[prefName],
              opacity: hoveredPrefecture === prefName ? 0.8 : 1,
              transform: hoveredPrefecture === prefName ? 'scale(1.02)' : 'scale(1)',
              transformOrigin: 'center',
            }}
            onMouseEnter={() => handleMouseEnter(prefName)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(prefName)}
          />
        ))}
        
        {/* より詳細な日本地図を表現するための代替表示 */}
        <text x="300" y="400" textAnchor="middle" className="text-sm fill-gray-500">
          ※ 実際の日本地図SVGデータを適用予定
        </text>
      </svg>

      {/* ホバー時の情報表示 */}
      {hoveredPrefecture && (
        <div className="absolute top-4 left-4 bg-white shadow-lg px-4 py-2 rounded-lg border">
          <div className="font-bold text-gray-900">{hoveredPrefecture}</div>
          <div className="text-sm text-gray-600">
            飲んだ種類: {prefectureStats[hoveredPrefecture] || 0}銘柄
          </div>
        </div>
      )}

      {/* 達成度表示 */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          達成度: {Object.keys(prefectureStats).filter(p => prefectureStats[p] > 0).length} / 47
        </div>
      </div>
    </div>
  );
};