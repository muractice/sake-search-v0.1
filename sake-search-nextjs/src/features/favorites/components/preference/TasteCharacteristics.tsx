'use client';

import { PreferenceVector } from '@/types/preference';

interface TasteCharacteristicsProps {
  vector: PreferenceVector;
}

export const TasteCharacteristics = ({ vector }: TasteCharacteristicsProps) => {
  const characteristics = [
    { key: 'f1_floral', label: '華やか', value: vector.f1_floral },
    { key: 'f2_mellow', label: 'まろやか', value: vector.f2_mellow },
    { key: 'f3_heavy', label: '重厚', value: vector.f3_heavy },
    { key: 'f4_mild', label: '穏やか', value: vector.f4_mild },
    { key: 'f5_dry', label: 'キレ', value: vector.f5_dry },
    { key: 'f6_light', label: '軽快', value: vector.f6_light },
  ];

  return (
    <div className="mb-6">
      <h4 className="text-sm font-bold mb-2 text-gray-900">味覚特性</h4>
      <div className="space-y-2">
        {characteristics.map((item) => (
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
  );
};