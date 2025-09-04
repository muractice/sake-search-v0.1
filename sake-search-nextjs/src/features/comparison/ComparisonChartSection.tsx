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
}

export const ComparisonChartSection = ({
  comparison,
  selection
}: ComparisonChartSectionProps) => {
  
  if (comparison.list.length === 0) {
    return null;
  }

  return (
    <>
      {/* 比較パネル */}
      <ComparisonPanel
        comparisonList={comparison.list}
        onRemove={comparison.onToggle}
        onClear={comparison.onClear}
        onSelectSake={selection.onSelectSake}
      />

      {/* 4象限チャート */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
          <span className="mr-3 text-2xl">📊</span>
          比較リストの味わいマップ
        </h2>
        <div className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
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
          比較リストの味覚特性
        </h2>
        <div className="min-h-[400px] md:min-h-[500px]">
          <SakeRadarChartSection sakeData={comparison.list} />
        </div>
      </div>
    </>
  );
};