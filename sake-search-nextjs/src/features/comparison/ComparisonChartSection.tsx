'use client';

import { SakeData } from '@/types/sake';
import { TasteChartCard } from '@/components/charts/TasteChartCard';
import { RadarChartCard } from '@/components/charts/RadarChartCard';

interface ComparisonProps {
  list: SakeData[];
  onToggle: (sake: SakeData) => void;
  onClear: () => void;
  // isInList は使用されていないため削除
}

interface SelectionProps {
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
}

interface ComparisonChartSectionProps {
  comparison: ComparisonProps;
  selection: SelectionProps;
  tasteMapTitle?: string;  // 味わいマップのタイトル（デフォルト: "比較リストの味わいマップ"）
  radarChartTitle?: string;  // レーダーチャートのタイトル（デフォルト: "比較リストの味覚特性"）
  tasteChartHeight?: 'md' | 'lg';  // チャート高さ（md: 400-600px, lg: 500-700px）
}

export const ComparisonChartSection = ({
  comparison,
  selection,
  tasteMapTitle = '味わいマップ',
  radarChartTitle = '比較リストの味覚特性',
  tasteChartHeight = 'md'
}: ComparisonChartSectionProps) => {
  
  if (comparison.list.length === 0) {
    return null;
  }

  return (
    <>
      {/* チャート表示エリア */}
      <div className="space-y-8">
        <TasteChartCard
          title={tasteMapTitle}
          sakeData={comparison.list}
          onSakeClick={selection.onChartClick}
          onRemoveSake={comparison.onToggle}
          onClearSake={comparison.onClear}
          minHeight={tasteChartHeight}
        />
        
        <RadarChartCard
          title={radarChartTitle}
          sakeData={comparison.list}
          minHeight="sm"
        />
      </div>
    </>
  );
};