'use client';

import { RefObject } from 'react';
import { SakeData } from '@/types/sake';

interface GachaSlotAnimationProps {
  isSlotAnimating: boolean;
  slotItems: SakeData[];
  slotRef: RefObject<HTMLDivElement | null>;
}

export const GachaSlotAnimation = ({
  isSlotAnimating,
  slotItems,
  slotRef
}: GachaSlotAnimationProps) => {
  if (!isSlotAnimating) return null;

  return (
    <div className="mt-4 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-400">
      <h3 className="text-center text-xl font-bold mb-4">🎰 おすすめガチャ回転中！ 🎰</h3>
      <div 
        ref={slotRef}
        className="relative h-32 overflow-hidden bg-white rounded-lg border-4 border-yellow-500 shadow-inner"
      >
        <div className="slot-reel absolute w-full">
          {slotItems.map((sake, index) => (
            <div 
              key={index}
              className="h-32 flex items-center justify-center border-b border-gray-200"
            >
              <div className="text-center p-4">
                <p className="font-bold text-lg">{sake.name}</p>
                <p className="text-sm text-gray-600">{sake.brewery}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};