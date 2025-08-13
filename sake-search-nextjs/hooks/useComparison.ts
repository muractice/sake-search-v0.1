import { useState } from 'react';
import { SakeData } from '@/types/sake';

export const useComparison = () => {
  const [comparisonList, setComparisonList] = useState<SakeData[]>([]);
  const [isComparisonMode, setIsComparisonMode] = useState(true);

  // プライベート関数（外部に公開しない）
  const addToComparison = (sake: SakeData) => {
    setComparisonList(prev => {
      if (prev.length >= 4 || prev.find(s => s.id === sake.id)) {
        return prev;
      }
      return [...prev, sake];
    });
  };

  const removeFromComparison = (sake: SakeData) => {
    setComparisonList(prev => prev.filter(s => s.id !== sake.id));
  };

  // パブリックAPI
  const isInComparison = (sakeId: string) => {
    return comparisonList.some(s => s.id === sakeId);
  };

  const toggleComparison = (sake: SakeData) => {
    if (isInComparison(sake.id)) {
      removeFromComparison(sake);
    } else {
      addToComparison(sake);
    }
  };

  const clearComparison = () => {
    setComparisonList([]);
    // 比較モードは維持する（比較リストをクリアしてもモードは保持）
  };

  const toggleComparisonMode = () => {
    setIsComparisonMode(prev => !prev);
  };

  // 公開するAPIのみreturn
  return {
    // 状態
    comparisonList,
    isComparisonMode,
    
    // メソッド（publicのみ）
    toggleComparison,
    isInComparison,
    clearComparison,
    toggleComparisonMode,
    // setIsComparisonMode を削除（toggleComparisonMode で十分）
  };
};