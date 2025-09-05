import { useState, useRef } from 'react';
import { SakeData } from '@/types/sake';
import { RecommendationResult } from '../types';

export const useGachaAnimation = (restaurantMenuItems: string[]) => {
  const [isSlotAnimating, setIsSlotAnimating] = useState(false);
  const [slotItems, setSlotItems] = useState<SakeData[]>([]);
  const [selectedGachaItem, setSelectedGachaItem] = useState<RecommendationResult | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  const startSlotAnimation = (result: RecommendationResult) => {
    setSelectedGachaItem(null);
    setIsSlotAnimating(true);
    
    // メニューアイテムからランダムに10個選んでスロットアイテムとする
    const menuSakeData: SakeData[] = restaurantMenuItems.map((name, index) => ({
      id: `temp-${index}`,
      name,
      brewery: '',
      brandId: 0,
      breweryId: 0,
      sweetness: 0,
      richness: 0,
      description: ''
    } as SakeData));
    
    // スロット用のアイテムを作成（結果を最後に配置）
    const shuffled = [...menuSakeData].sort(() => Math.random() - 0.5).slice(0, 9);
    shuffled.push(result.sake);
    setSlotItems(shuffled);
    
    // DOM更新後にアニメーション実行
    setTimeout(() => {
      if (slotRef.current) {
        const reel = slotRef.current.querySelector('.slot-reel') as HTMLElement;
        if (reel) {
          let position = 0;
          const itemHeight = 128; // h-32 = 128px
          const totalItems = shuffled.length;
          const finalPosition = (totalItems - 1) * itemHeight;
          
          // 高速回転
          const fastInterval = setInterval(() => {
            position += itemHeight;
            if (position >= totalItems * itemHeight) {
              position = 0;
            }
            reel.style.transform = `translateY(-${position}px)`;
          }, 50);
          
          // 3秒後に減速して停止
          setTimeout(() => {
            clearInterval(fastInterval);
            
            // 減速アニメーション
            reel.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            reel.style.transform = `translateY(-${finalPosition}px)`;
            
            // アニメーション終了後
            setTimeout(() => {
              setIsSlotAnimating(false);
              setSelectedGachaItem(result);
              reel.style.transition = '';
            }, 1000);
          }, 3000);
        }
      }
    }, 100); // 100ms待ってからDOM操作を実行
  };

  const resetGacha = () => {
    setSelectedGachaItem(null);
  };

  return {
    // 状態
    isSlotAnimating,
    slotItems,
    selectedGachaItem,
    slotRef,
    
    // アクション
    startSlotAnimation,
    resetGacha,
  };
};