'use client';

import { usePreferenceAnalysis } from '@/hooks/usePreferenceAnalysis';
import { TasteType } from '@/types/preference';

const tasteTypeLabels: Record<TasteType, string> = {
  floral: '🌸 華やか系',
  mellow: '🍯 まろやか系',
  heavy: '⚔️ 重厚系',
  mild: '🍃 穏やか系',
  dry: '💎 キレ系',
  light: '🦋 軽快系',
  balanced: '🎭 バランス型',
  explorer: '🚀 冒険家型',
};

const tasteTypeDescriptions: Record<TasteType, string> = {
  floral: '華やかで香り高い日本酒を好む傾向',
  mellow: 'まろやかで芳醇な味わいを好む傾向',
  heavy: '重厚で深みのある日本酒を好む傾向',
  mild: '穏やかで優しい味わいを好む傾向',
  dry: 'キレがよくドライな日本酒を好む傾向',
  light: '軽快で飲みやすい日本酒を好む傾向',
  balanced: 'バランスの取れた日本酒を好む傾向',
  explorer: '様々な味わいに挑戦する傾向',
};

interface PreferenceMapProps {
  className?: string;
}

export const PreferenceMap = ({ className = '' }: PreferenceMapProps) => {
  const { preference, loading, error, hasEnoughData, refresh } = usePreferenceAnalysis();

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <h3 className="text-lg font-bold mb-4">好み分析</h3>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">分析中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <h3 className="text-lg font-bold mb-4">好み分析</h3>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <h3 className="text-lg font-bold mb-4">好み分析</h3>
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            好み分析を行うには、3件以上のお気に入り登録が必要です
          </p>
          <p className="text-sm text-gray-500">
            気になる日本酒をお気に入りに追加してみてください
          </p>
        </div>
      </div>
    );
  }

  if (!preference) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <h3 className="text-lg font-bold mb-4">好み分析</h3>
        <div className="text-center">
          <p className="text-gray-600 mb-4">好み分析データがありません</p>
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            分析開始
          </button>
        </div>
      </div>
    );
  }

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
      <div className="mb-6">
        <div className="text-center mb-2">
          <span className="text-2xl font-bold text-blue-600">
            {tasteTypeLabels[preference.tasteType]}
          </span>
        </div>
        <p className="text-sm text-gray-600 text-center">
          {tasteTypeDescriptions[preference.tasteType]}
        </p>
      </div>

      {/* 4象限マップ */}
      <div className="mb-6">
        <h4 className="text-sm font-bold mb-2">好みマップ</h4>
        <div className="relative bg-gray-50 border rounded-lg" style={{ height: '200px' }}>
          {/* 軸ラベル（横軸：辛い-甘い、縦軸：淡-濃） */}
          {/* 横軸ラベル（中央線の下） */}
          <div className="absolute left-2 top-1/2 mt-2 text-xs text-gray-500">
            辛い
          </div>
          <div className="absolute right-2 top-1/2 mt-2 text-xs text-gray-500">
            甘い
          </div>
          {/* 縦軸ラベル（中央線の左） */}
          <div className="absolute left-1/2 -ml-6 bottom-2 text-xs text-gray-500">
            淡
          </div>
          <div className="absolute left-1/2 -ml-6 top-2 text-xs text-gray-500">
            濃
          </div>

          {/* 中心線 */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300"></div>

          {/* 好みポイント */}
          <div
            className="absolute w-4 h-4 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              // X軸：甘辛度（-5が辛い/左、+5が甘い/右）
              left: `${50 + (preference.vector.sweetness / 5) * 40}%`,
              // Y軸：淡濃度（-5が淡/下、+5が濃/上）
              top: `${50 - (preference.vector.richness / 5) * 40}%`,
            }}
            title={`甘辛度: ${preference.vector.sweetness.toFixed(1)}, 淡濃度: ${preference.vector.richness.toFixed(1)}`}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-blue-600">
              あなた
            </div>
          </div>
        </div>
      </div>

      {/* 6要素レーダーチャート（簡易版） */}
      <div className="mb-6">
        <h4 className="text-sm font-bold mb-2">味覚特性</h4>
        <div className="space-y-2">
          {[
            { key: 'f1_floral', label: '華やか', value: preference.vector.f1_floral },
            { key: 'f2_mellow', label: 'まろやか', value: preference.vector.f2_mellow },
            { key: 'f3_heavy', label: '重厚', value: preference.vector.f3_heavy },
            { key: 'f4_mild', label: '穏やか', value: preference.vector.f4_mild },
            { key: 'f5_dry', label: 'キレ', value: preference.vector.f5_dry },
            { key: 'f6_light', label: '軽快', value: preference.vector.f6_light },
          ].map((item) => (
            <div key={item.key} className="flex items-center">
              <span className="text-xs w-16 text-gray-600">{item.label}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${item.value * 100}%` }}
                ></div>
              </div>
              <span className="text-xs w-8 text-gray-500">
                {Math.round(item.value * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-xs text-gray-600">多様性</div>
          <div className="text-sm font-bold text-blue-600">
            {Math.round(preference.diversityScore * 100)}%
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-xs text-gray-600">冒険度</div>
          <div className="text-sm font-bold text-green-600">
            {Math.round(preference.adventureScore * 100)}%
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        分析対象: {preference.totalFavorites}件のお気に入り
      </div>
    </div>
  );
};