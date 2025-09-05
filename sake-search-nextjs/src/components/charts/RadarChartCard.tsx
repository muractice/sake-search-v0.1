'use client';

import { SakeData } from '@/types/sake';
import SakeRadarChartSection from '@/features/comparison/SakeRadarChartSection';

interface RadarChartCardProps {
  title: string;                    // タイトル
  icon?: string;                   // アイコン（デフォルト: "🎯"）
  sakeData: SakeData[];            // チャートデータ
  minHeight?: 'sm' | 'md';        // 高さバリエーション
  className?: string;              // 追加スタイル
}

export const RadarChartCard = ({
  title,
  icon = '🎯',
  sakeData,
  minHeight = 'sm',
  className = ''
}: RadarChartCardProps) => {
  // 高さのクラス名を決定
  const heightClasses = {
    sm: 'min-h-[400px] md:min-h-[500px]',
    md: 'min-h-[500px] md:min-h-[600px]'
  };

  const heightClass = heightClasses[minHeight];

  return (
    <div className={`bg-white rounded-lg shadow-md p-8 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
        <span className="mr-3 text-2xl">{icon}</span>
        {title}
      </h2>
      <div className={heightClass}>
        <SakeRadarChartSection sakeData={sakeData} />
      </div>
    </div>
  );
};