import { useState } from 'react';
import { SakeData } from '@/types/sake';

export const useComparison = () => {
  const [comparisonList, setComparisonList] = useState<SakeData[]>([]);
  // 比較モードは常にON（切り替え機能を削除）

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
  };

  // toggleComparisonMode を削除（常にONのため不要）

  // 公開するAPIのみreturn
  return {
    // 状態
    comparisonList,
    
    // メソッド（publicのみ）
    toggleComparison,
    isInComparison,
    clearComparison,
    // isComparisonMode と toggleComparisonMode を削除（常にONのため不要）
  };
};