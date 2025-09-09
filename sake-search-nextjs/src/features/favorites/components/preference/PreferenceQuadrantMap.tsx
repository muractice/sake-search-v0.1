'use client';

import { PreferenceVector } from '@/types/preference';

interface PreferenceQuadrantMapProps {
  vector: PreferenceVector;
}

export const PreferenceQuadrantMap = ({ vector }: PreferenceQuadrantMapProps) => {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-bold mb-2">好みマップ</h4>
      <div className="relative bg-gray-50 border rounded-lg" style={{ height: '200px' }}>
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
            left: `${50 + (vector.sweetness / 5) * 40}%`,
            // Y軸：淡濃度（-5が淡/下、+5が濃/上）
            top: `${50 - (vector.richness / 5) * 40}%`,
          }}
          title={`甘辛度: ${vector.sweetness.toFixed(1)}, 淡濃度: ${vector.richness.toFixed(1)}`}
        >
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-blue-600">
            あなた
          </div>
        </div>
      </div>
    </div>
  );
};