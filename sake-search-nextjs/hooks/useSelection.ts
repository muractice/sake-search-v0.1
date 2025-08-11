import { useState } from 'react';
import { SakeData } from '@/types/sake';

export const useSelection = () => {
  const [selectedSake, setSelectedSake] = useState<SakeData | null>(null);

  // パブリックAPI
  const selectSake = (sake: SakeData | null) => {
    setSelectedSake(sake);
  };

  const clearSelection = () => {
    setSelectedSake(null);
  };

  const handleChartClick = (sake: SakeData) => {
    setSelectedSake(sake);
  };

  // 公開するAPIのみreturn
  return {
    // 状態
    selectedSake,
    
    // メソッド
    selectSake,
    clearSelection,
    handleChartClick,
  };
};