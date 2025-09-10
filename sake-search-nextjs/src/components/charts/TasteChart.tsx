'use client';

import { SakeData } from '@/types/sake';
import TasteChartComponent from './taste-chart/TasteChart';

interface TasteChartProps {
  sakeData: SakeData[];
  onSakeClick: (sake: SakeData) => void;
  onRemoveSake?: (sake: SakeData) => void;
  onClearSake?: () => void;
}

export default function TasteChart({ sakeData, onSakeClick, onRemoveSake, onClearSake }: TasteChartProps) {
  return (
    <TasteChartComponent 
      sakeData={sakeData}
      onSakeClick={onSakeClick}
      onRemoveSake={onRemoveSake}
      onClearSake={onClearSake}
    />
  );
}