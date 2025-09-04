'use client';

import { SakeData } from '@/types/sake';
import ComparisonPanel from '@/features/comparison/ComparisonPanel';
import TasteChart from '@/components/charts/TasteChart';
import SakeRadarChartSection from '@/features/comparison/SakeRadarChartSection';

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
  showComparisonPanel?: boolean;  // 比較パネル表示フラグ（デフォルト: true）
  tasteMapTitle?: string;  // 味わいマップのタイトル（デフォルト: "比較リストの味わいマップ"）
  radarChartTitle?: string;  // レーダーチャートのタイトル（デフォルト: "比較リストの味覚特性"）
  tasteChartHeight?: 'md' | 'lg';  // チャート高さ（md: 400-600px, lg: 500-700px）
}

export const ComparisonChartSection = ({
  comparison,
  selection,
  showComparisonPanel = true,
  tasteMapTitle = '比較リストの味わいマップ',
  radarChartTitle = '比較リストの味覚特性',
  tasteChartHeight = 'md'
}: ComparisonChartSectionProps) => {
  
  if (comparison.list.length === 0) {
    return null;
  }

  // 高さのクラス名を決定
  const tasteChartHeightClass = tasteChartHeight === 'lg' 
    ? 'min-h-[500px] md:min-h-[600px] lg:min-h-[700px]'
    : 'min-h-[400px] md:min-h-[500px] lg:min-h-[600px]';

  return (
    <>
      {/* 比較パネル */}
      {showComparisonPanel && (
        <ComparisonPanel
          comparisonList={comparison.list}
          onRemove={comparison.onToggle}
          onClear={comparison.onClear}
          onSelectSake={selection.onSelectSake}
        />
      )}

      {/* チャート表示エリア */}
      <div className="space-y-8">
        {/* 4象限チャート */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
            <span className="mr-3 text-2xl">📊</span>
            {tasteMapTitle}
          </h2>
          <div className={tasteChartHeightClass}>
            <TasteChart 
              sakeData={comparison.list}
              onSakeClick={selection.onChartClick}
            />
          </div>
        </div>

        {/* レーダーチャート */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
            <span className="mr-3 text-2xl">🎯</span>
            {radarChartTitle}
          </h2>
          <div className="min-h-[400px] md:min-h-[500px]">
            <SakeRadarChartSection sakeData={comparison.list} />
          </div>
        </div>
      </div>
    </>
  );
};