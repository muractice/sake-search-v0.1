'use client';

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

interface PreferenceTypeDisplayProps {
  tasteType: TasteType;
}

export const PreferenceTypeDisplay = ({ tasteType }: PreferenceTypeDisplayProps) => {
  return (
    <div className="mb-6">
      <div className="text-center mb-2">
        <span className="text-2xl font-bold text-blue-600">
          {tasteTypeLabels[tasteType]}
        </span>
      </div>
      <p className="text-sm text-gray-600 text-center">
        {tasteTypeDescriptions[tasteType]}
      </p>
    </div>
  );
};