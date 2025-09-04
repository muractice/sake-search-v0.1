'use client';

import SearchSection from '@/features/search/SearchSection';
import { ComparisonChartSection } from '@/features/comparison/ComparisonChartSection';
import { SakeData } from '@/types/sake';

interface SearchTabProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
  searchResults: SakeData[];
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
}

export const SearchTab = ({
  onSearch,
  isLoading,
  searchResults,
  comparisonList,
  onToggleComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
  isInComparison,
}: SearchTabProps) => {
  return (
    <div className="space-y-6">
      {/* 検索セクション */}
      <SearchSection 
        onSearch={onSearch}
        isLoading={isLoading}
        searchResults={searchResults}
        onSelectSake={onToggleComparison}
        isInComparison={isInComparison}
      />

      {/* 比較パネルとチャート */}
      {comparisonList.length > 0 && (
        <ComparisonChartSection
          comparison={{
            list: comparisonList,
            onToggle: onToggleComparison,
            onClear: onClearComparison,
          }}
          selection={{
            onSelectSake: onSelectSake,
            onChartClick: onChartClick,
          }}
          showComparisonPanel={true}
          tasteMapTitle="味わいマップ"
          radarChartTitle="味覚特性"
          tasteChartHeight="lg"
        />
      )}
    </div>
  );
};