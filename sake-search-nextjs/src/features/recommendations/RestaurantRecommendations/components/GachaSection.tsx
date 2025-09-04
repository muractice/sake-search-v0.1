'use client';

import { RefObject } from 'react';
import { SakeData } from '@/types/sake';
import { RecommendationResult } from '../types';
import { GachaSlotAnimation } from './GachaSlotAnimation';
import { GachaResult } from './GachaResult';

interface GachaSectionProps {
  showRecommendations: boolean;
  isSlotAnimating: boolean;
  slotItems: SakeData[];
  slotRef: RefObject<HTMLDivElement | null>;
  selectedGachaItem: RecommendationResult | null;
  isInComparison: (sakeId: string) => boolean;
  onToggleComparison: (sake: SakeData) => void;
  onPlayAgain: () => void;
  onStartGacha: () => void;
}

export const GachaSection = ({
  showRecommendations,
  isSlotAnimating,
  slotItems,
  slotRef,
  selectedGachaItem,
  isInComparison,
  onToggleComparison,
  onPlayAgain,
  onStartGacha,
}: GachaSectionProps) => {

  return (
    <>
      {/* ガチャスロット演出 */}
      <GachaSlotAnimation 
        isSlotAnimating={isSlotAnimating}
        slotItems={slotItems}
        slotRef={slotRef}
      />
      
      {/* ガチャ結果表示 */}
      {selectedGachaItem && !isSlotAnimating && (
        <GachaResult
          selectedGachaItem={selectedGachaItem}
          isInComparison={isInComparison}
          onToggleComparison={onToggleComparison}
          onPlayAgain={onPlayAgain}
        />
      )}
      
      {/* ガチャのデフォルト表示（何も表示していない状態） */}
      {!selectedGachaItem && !isSlotAnimating && showRecommendations && (
        <div className="mt-4 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-400">
          <div className="text-center">
            <p className="text-gray-500 mb-4">🎲 おすすめガチャをお楽しみください！</p>
            <p className="text-sm text-gray-400 mb-4">メニューからランダムに日本酒を選択します</p>
            <button
              onClick={onStartGacha}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 font-bold text-lg"
            >
              🎰 ガチャを回す！
            </button>
          </div>
        </div>
      )}
    </>
  );
};