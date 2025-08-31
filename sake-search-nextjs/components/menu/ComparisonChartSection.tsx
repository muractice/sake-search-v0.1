'use client';

import { SakeData } from '@/types/sake';
import ComparisonPanel from '@/components/user/ComparisonPanel';
import TasteChart from '@/components/charts/TasteChart';
import SakeRadarChartSection from '@/components/charts/SakeRadarChartSection';

interface ComparisonChartSectionProps {
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
}

export const ComparisonChartSection = ({
  comparisonList,
  onToggleComparison,
  onClearComparison,
  onSelectSake,
  onChartClick
}: ComparisonChartSectionProps) => {
  
  if (comparisonList.length === 0) {
    return null;
  }

  return (
    <>
      {/* 比較パネル */}
      <ComparisonPanel
        comparisonList={comparisonList}
        onRemove={onToggleComparison}
        onClear={onClearComparison}
        onSelectSake={onSelectSake}
      />

      {/* 4象限チャート */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
          <span className="mr-3 text-2xl">📊</span>
          比較リストの味わいマップ
        </h2>
        <div className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
          <TasteChart 
            sakeData={comparisonList}
            onSakeClick={onChartClick}
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
          <SakeRadarChartSection sakeData={comparisonList} />
        </div>
      </div>
    </>
  );
};