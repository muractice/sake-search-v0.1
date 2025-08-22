'use client';

import { useState } from 'react';
import Japan from '@react-map/japan';

interface JapanMapJSProps {
  prefectureStats: { [key: string]: number };
  onPrefectureClick: (prefectureName: string) => void;
}

export const JapanMapJS = ({ prefectureStats, onPrefectureClick }: JapanMapJSProps) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  // 記録数に基づく色を取得
  const getColorForPrefecture = (count: number) => {
    if (count === 0) return '#e5e7eb'; // gray-200
    if (count >= 10) return '#15803d'; // green-700
    if (count >= 5) return '#16a34a'; // green-600
    if (count >= 3) return '#22c55e'; // green-500
    if (count >= 1) return '#4ade80'; // green-400
    return '#86efac'; // green-300
  };

  // 都道府県名から@react-map/japan用の形式に変換
  const prefectureNameToKey = (name: string) => {
    const mapping: { [key: string]: string } = {
      '北海道': 'hokkaido',
      '青森県': 'aomori',
      '岩手県': 'iwate',
      '宮城県': 'miyagi',
      '秋田県': 'akita',
      '山形県': 'yamagata',
      '福島県': 'fukushima',
      '茨城県': 'ibaraki',
      '栃木県': 'tochigi',
      '群馬県': 'gunma',
      '埼玉県': 'saitama',
      '千葉県': 'chiba',
      '東京都': 'tokyo',
      '神奈川県': 'kanagawa',
      '新潟県': 'niigata',
      '富山県': 'toyama',
      '石川県': 'ishikawa',
      '福井県': 'fukui',
      '山梨県': 'yamanashi',
      '長野県': 'nagano',
      '岐阜県': 'gifu',
      '静岡県': 'shizuoka',
      '愛知県': 'aichi',
      '三重県': 'mie',
      '滋賀県': 'shiga',
      '京都府': 'kyoto',
      '大阪府': 'osaka',
      '兵庫県': 'hyogo',
      '奈良県': 'nara',
      '和歌山県': 'wakayama',
      '鳥取県': 'tottori',
      '島根県': 'shimane',
      '岡山県': 'okayama',
      '広島県': 'hiroshima',
      '山口県': 'yamaguchi',
      '徳島県': 'tokushima',
      '香川県': 'kagawa',
      '愛媛県': 'ehime',
      '高知県': 'kochi',
      '福岡県': 'fukuoka',
      '佐賀県': 'saga',
      '長崎県': 'nagasaki',
      '熊本県': 'kumamoto',
      '大分県': 'oita',
      '宮崎県': 'miyazaki',
      '鹿児島県': 'kagoshima',
      '沖縄県': 'okinawa'
    };
    return mapping[name];
  };

  // @react-map/japan用の都道府県色データ作成
  const cityColors = Object.entries(prefectureStats).reduce((acc, [name, count]) => {
    const key = prefectureNameToKey(name);
    if (key) {
      acc[key] = getColorForPrefecture(count);
    }
    return acc;
  }, {} as { [key: string]: string });

  const conqueredCount = Object.keys(prefectureStats).filter(p => prefectureStats[p] > 0).length;
  const conquestRate = Math.round((conqueredCount / 47) * 100);

  return (
    <div className="relative">
      {/* タイトルと達成度 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">飲んだことのある日本酒マップ</h3>
        <div className="text-sm text-gray-600">
          達成度：{conqueredCount} / 47 ({conquestRate}%)
        </div>
      </div>

      {/* 日本地図 */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="mx-auto" style={{ maxWidth: '800px' }}>
          <Japan
            type="select-single"
            size={800}
            strokeColor="#374151"
            strokeWidth={0.5}
            hoverColor="#065f46"
            selectColor="#15803d"
            hints={true}
            cityColors={cityColors}
            onSelect={(selectedPrefecture) => {
              if (selectedPrefecture) {
                const prefName = Object.keys(prefectureStats).find(name => 
                  prefectureNameToKey(name) === selectedPrefecture
                );
                if (prefName) {
                  onPrefectureClick(prefName);
                }
              }
            }}
          />
        </div>
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

      {/* ランキングと凡例 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 銘柄ごとのランキング */}
        <div>
          <h4 className="text-sm font-bold mb-2 text-gray-700">都道府県ごとのランキング</h4>
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
                    <div 
                      className="h-2 bg-green-500 rounded" 
                      style={{ 
                        width: `${Math.max((count / Math.max(...Object.values(prefectureStats))) * 100, 10)}px` 
                      }}
                    />
                    <span className="text-gray-600 font-medium">{count}銘柄</span>
                  </div>
                </div>
              ))}
          </div>
          {Object.keys(prefectureStats).filter(p => prefectureStats[p] > 0).length === 0 && (
            <p className="text-sm text-gray-500">まだ記録がありません</p>
          )}
        </div>

        {/* 凡例 */}
        <div>
          <h4 className="text-sm font-bold mb-2 text-gray-700">凡例</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e5e7eb' }}></div>
              <span>未記録</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4ade80' }}></div>
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