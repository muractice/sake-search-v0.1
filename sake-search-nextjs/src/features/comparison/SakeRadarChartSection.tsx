'use client';

import SakeRadarChart from '@/components/charts/SakeRadarChart';
import { SakeData } from '@/types/sake';

interface SakeRadarChartSectionProps {
  sakeData: SakeData[];
}

export default function SakeRadarChartSection({ sakeData }: SakeRadarChartSectionProps) {
  if (sakeData.length === 0) {
    return null;
  }

  // レスポンシブなグリッドレイアウトのクラスを決定
  const getGridClass = () => {
    const count = sakeData.length;
    if (count === 1) {
      return 'grid-cols-1 max-w-md mx-auto';
    } else if (count === 2) {
      return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    } else if (count <= 4) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4';
    } else if (count <= 6) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    } else {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className="transform transition-all duration-500 hover:scale-[1.01]">
      <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          味覚特性レーダーチャート
        </h2>
        
        {sakeData.length > 0 ? (
          <div className="animate-slide-up">
            <div className={`grid ${getGridClass()} gap-4`}>
              {sakeData.map((sake, index) => (
                <SakeRadarChart
                  key={sake.id}
                  sake={sake}
                  index={index}
                />
              ))}
            </div>
            
            {/* 凡例説明 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-bold text-gray-700 mb-2">味覚特性の説明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-semibold">華やか度:</span> フルーティーで華やかな香り
                </div>
                <div>
                  <span className="font-semibold">芳醇度:</span> 深みのある豊かな味わい
                </div>
                <div>
                  <span className="font-semibold">重厚度:</span> どっしりとした重みのある味
                </div>
                <div>
                  <span className="font-semibold">穏やか度:</span> まろやかで優しい口当たり
                </div>
                <div>
                  <span className="font-semibold">ドライ度:</span> キレのある辛口の味わい
                </div>
                <div>
                  <span className="font-semibold">軽快度:</span> さらりとした軽やかな飲み口
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
            <div className="text-center">
              <div className="text-5xl mb-4">📡</div>
              <p className="text-lg">日本酒を選択してレーダーチャートを表示</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}