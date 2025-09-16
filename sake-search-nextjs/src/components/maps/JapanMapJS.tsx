'use client';

import { useState, useEffect } from 'react';
import Japan from '@react-map/japan';

interface JapanMapJSProps {
  prefectureStats: { [key: string]: number };
}

export const JapanMapJS = ({ prefectureStats }: JapanMapJSProps) => {
  const [mapSize, setMapSize] = useState(350);

  useEffect(() => {
    const updateMapSize = () => {
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth;
        // 北海道上部に余裕を持たせるため、さらに小さく
        setMapSize(Math.min(280, screenWidth - 70));
      }
    };

    updateMapSize();
    window?.addEventListener('resize', updateMapSize);
    return () => window?.removeEventListener('resize', updateMapSize);
  }, []);

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
      '北海道': 'Hokkaido',
      '青森県': 'Aomori',
      '岩手県': 'Iwate',
      '宮城県': 'Miyagi',
      '秋田県': 'Akita',
      '山形県': 'Yamagata',
      '福島県': 'Fukushima',
      '茨城県': 'Ibaraki',
      '栃木県': 'Tochigi',
      '群馬県': 'Gunma',
      '埼玉県': 'Saitama',
      '千葉県': 'Chiba',
      '東京都': 'Tokyo',
      '神奈川県': 'Kanagawa',
      '新潟県': 'Niigata',
      '富山県': 'Toyama',
      '石川県': 'Ishikawa',
      '福井県': 'Fukui',
      '山梨県': 'Yamanashi',
      '長野県': 'Nagano',
      '岐阜県': 'Gifu',
      '静岡県': 'Shizuoka',
      '愛知県': 'Aichi',
      '三重県': 'Mie',
      '滋賀県': 'Shiga',
      '京都府': 'Kyoto',
      '大阪府': 'Osaka',
      '兵庫県': 'Hyogo',
      '奈良県': 'Nara',
      '和歌山県': 'Wakayama',
      '鳥取県': 'Tottori',
      '島根県': 'Shimane',
      '岡山県': 'Okayama',
      '広島県': 'Hiroshima',
      '山口県': 'Yamaguchi',
      '徳島県': 'Tokushima',
      '香川県': 'Kagawa',
      '愛媛県': 'Ehime',
      '高知県': 'Kochi',
      '福岡県': 'Fukuoka',
      '佐賀県': 'Saga',
      '長崎県': 'Nagasaki',
      '熊本県': 'Kumamoto',
      '大分県': 'Oita',
      '宮崎県': 'Miyazaki',
      '鹿児島県': 'Kagoshima',
      '沖縄県': 'Okinawa'
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
        <h3 className="text-lg font-bold mb-2 text-gray-900">飲んだことのある日本酒マップ</h3>
        <div className="text-sm text-gray-800 font-medium">
          達成度：{conqueredCount} / 47 ({conquestRate}%)
        </div>
      </div>

      {/* 日本地図 */}
      <div className="bg-gray-50 rounded-lg p-2 sm:p-4 border overflow-hidden">
        <div className="flex justify-center">
          <div className="w-full max-w-[85vw] sm:max-w-[600px]">
            <div className="block sm:hidden" style={{ pointerEvents: 'none' }}>
              <Japan
                type="select-multiple"
                size={mapSize}
                mapColor="#e5e7eb"
                strokeColor="#374151"
                strokeWidth={0.3}
                hoverColor="#e5e7eb"
                hints={false}
                cityColors={cityColors}
                disableClick={true}
                disableHover={true}
                onSelect={() => {
                  // クリック時の色変更を防ぐため何もしない
                }}
              />
            </div>
            <div className="hidden sm:block" style={{ pointerEvents: 'none' }}>
              <Japan
                type="select-multiple"
                size={600}
                mapColor="#e5e7eb"
                strokeColor="#374151"
                strokeWidth={0.5}
                hoverColor="#e5e7eb"
                hints={false}
                cityColors={cityColors}
                disableClick={true}
                disableHover={true}
                onSelect={() => {
                  // クリック時の色変更を防ぐため何もしない
                }}
              />
            </div>
          </div>
        </div>
      </div>


      {/* ランキングと凡例 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 銘柄ごとのランキング */}
        <div>
          <h4 className="text-sm font-bold mb-2 text-gray-900">都道府県ごとのランキング</h4>
          <div className="space-y-1">
            {Object.entries(prefectureStats)
              .filter(([, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count], index) => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-gray-800 font-medium">{name}</span>
                  <div className="flex items-center gap-1">
                    <div 
                      className="h-2 bg-green-500 rounded" 
                      style={{ 
                        width: `${Math.max((count / Math.max(...Object.values(prefectureStats))) * 100, 10)}px` 
                      }}
                    />
                    <span className="text-gray-800 font-medium">{count}銘柄</span>
                  </div>
                </div>
              ))}
          </div>
          {Object.keys(prefectureStats).filter(p => prefectureStats[p] > 0).length === 0 && (
            <p className="text-sm text-gray-800 font-medium">まだ記録がありません</p>
          )}
        </div>

        {/* 凡例 */}
        <div>
          <h4 className="text-sm font-bold mb-2 text-gray-900">凡例</h4>
          <div className="space-y-1 text-sm text-gray-800 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e5e7eb' }}></div>
              <span className="text-gray-800 font-medium">未記録</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4ade80' }}></div>
              <span className="text-gray-800 font-medium">1-2銘柄</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="text-gray-800 font-medium">3-4銘柄</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }}></div>
              <span className="text-gray-800 font-medium">5-9銘柄</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#15803d' }}></div>
              <span className="text-gray-800 font-medium">10銘柄以上</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};