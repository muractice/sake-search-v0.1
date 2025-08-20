'use client';

import SearchSection from '@/components/SearchSection';
import TasteChart from '@/components/TasteChart';
import SakeRadarChartSection from '@/components/SakeRadarChartSection';
import ComparisonPanel from '@/components/ComparisonPanel';
import { SakeData } from '@/types/sake';

interface SearchTabProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
}

export const SearchTab = ({
  onSearch,
  isLoading,
  comparisonList,
  onToggleComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
}: SearchTabProps) => {
  return (
    <div className="space-y-6">
      {/* 検索セクション */}
      <SearchSection 
        onSearch={onSearch}
        isLoading={isLoading}
      />

      {/* 比較パネル */}
      {comparisonList.length > 0 && (
        <ComparisonPanel
          comparisonList={comparisonList}
          onRemove={onToggleComparison}
          onClear={onClearComparison}
          onSelectSake={onSelectSake}
        />
      )}

      {/* チャート表示エリア */}
      <div className="space-y-8">
        {/* 4象限チャート */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3 text-2xl">📊</span>
            味わいマップ
          </h2>
          <div className="h-96 md:h-[500px] lg:h-[600px]">
            <TasteChart 
              sakeData={comparisonList}
              onSakeClick={onChartClick}
            />
          </div>
        </div>

        {/* レーダーチャート */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3 text-2xl">🎯</span>
            味覚特性
          </h2>
          <div className="min-h-[400px] md:min-h-[500px]">
            <SakeRadarChartSection sakeData={comparisonList} />
          </div>
        </div>
      </div>
    </div>
  );
};