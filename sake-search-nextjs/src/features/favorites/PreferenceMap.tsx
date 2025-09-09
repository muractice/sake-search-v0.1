'use client';

import { usePreferenceAnalysis } from '@/features/favorites/hooks/usePreferenceAnalysis';
import {
  LoadingState,
  ErrorState,
  InsufficientDataState,
  NoDataState,
  PreferenceTypeDisplay,
  PreferenceQuadrantMap,
  TasteCharacteristics,
  PreferenceStatistics,
} from '@/features/favorites/components/preference';
import SakeRadarChart from '@/components/charts/SakeRadarChart';
import { SakeData } from '@/types/sake';


interface PreferenceMapProps {
  className?: string;
}

export const PreferenceMap = ({ className = '' }: PreferenceMapProps) => {
  const { preference, loading, error, hasEnoughData, refresh } = usePreferenceAnalysis();

  // PreferenceデータからSakeDataオブジェクトを作成（レーダーチャート用）
  const createSakeDataFromPreference = (): SakeData | null => {
    if (!preference) return null;
    
    return {
      id: 'user-preference',
      brandId: 0,
      name: 'あなたの好み',
      brewery: '',
      breweryId: 0,
      sweetness: preference.vector.sweetness,
      richness: preference.vector.richness,
      description: '',
      flavorChart: {
        brandId: 0,
        f1: preference.vector.f1_floral,
        f2: preference.vector.f2_mellow,
        f3: preference.vector.f3_heavy,
        f4: preference.vector.f4_mild,
        f5: preference.vector.f5_dry,
        f6: preference.vector.f6_light,
      },
    };
  };

  if (loading) {
    return <LoadingState className={className} />;
  }

  if (error) {
    return <ErrorState error={error} onRefresh={refresh} className={className} />;
  }

  if (!hasEnoughData) {
    return <InsufficientDataState className={className} />;
  }

  if (!preference) {
    return <NoDataState onRefresh={refresh} className={className} />;
  }

  const preferenceSakeData = createSakeDataFromPreference();

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🎯 あなたの好み分析</h3>
        <button
          onClick={refresh}
          className="text-sm text-blue-600 hover:text-blue-800"
          title="分析を更新"
        >
          🔄 更新
        </button>
      </div>

      {/* タイプ表示 */}
      <PreferenceTypeDisplay tasteType={preference.tasteType} />

      {/* 4象限マップ */}
      <PreferenceQuadrantMap vector={preference.vector} />

      {/* 味覚特性（バーチャート） */}
      <TasteCharacteristics vector={preference.vector} />

      {/* 味覚特性（レーダーチャート） */}
      {preferenceSakeData && (
        <div className="mb-6">
          <h4 className="text-sm font-bold mb-2">味覚特性レーダー</h4>
          <div className="max-w-sm mx-auto">
            <SakeRadarChart sake={preferenceSakeData} index={0} />
          </div>
        </div>
      )}

      {/* 統計情報 */}
      <PreferenceStatistics
        diversityScore={preference.diversityScore}
        adventureScore={preference.adventureScore}
        totalFavorites={preference.totalFavorites}
      />
    </div>
  );
};