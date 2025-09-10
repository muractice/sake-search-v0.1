'use client';

import { SakeData } from '@/types/sake';
import TasteChart from './TasteChart';

interface TasteChartCardProps {
  title: string;                           // タイトル
  icon?: string;                          // アイコン（デフォルト: "📊"）
  sakeData: SakeData[];                   // チャートデータ
  onSakeClick: (sake: SakeData) => void;  // クリックハンドラー
  onRemoveSake?: (sake: SakeData) => void; // 削除ハンドラー
  minHeight?: 'sm' | 'md' | 'lg';        // 高さバリエーション
  className?: string;                     // 追加スタイル
}

export const TasteChartCard = ({
  title,
  icon = '📊',
  sakeData,
  onSakeClick,
  onRemoveSake,
  minHeight = 'md',
  className = ''
}: TasteChartCardProps) => {
  // 高さのクラス名を決定
  const heightClasses = {
    sm: 'min-h-[400px] md:min-h-[500px]',
    md: 'min-h-[400px] md:min-h-[500px] lg:min-h-[600px]',
    lg: 'min-h-[500px] md:min-h-[600px] lg:min-h-[700px]'
  };

  const heightClass = heightClasses[minHeight];

  return (
    <div className={`bg-white rounded-lg shadow-md p-8 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
        <span className="mr-3 text-2xl">{icon}</span>
        {title}
      </h2>
      <div className={heightClass}>
        <TasteChart 
          sakeData={sakeData}
          onSakeClick={onSakeClick}
          onRemoveSake={onRemoveSake}
        />
      </div>
    </div>
  );
};