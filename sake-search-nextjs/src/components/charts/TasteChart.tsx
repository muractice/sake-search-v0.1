'use client';

import { SakeData } from '@/types/sake';
import TasteChartComponent from './taste-chart/TasteChart';

interface TasteChartProps {
  sakeData: SakeData[];
  onSakeClick: (sake: SakeData) => void;
}

export default function TasteChart({ sakeData, onSakeClick }: TasteChartProps) {
  return (
    <TasteChartComponent 
      sakeData={sakeData}
      onSakeClick={onSakeClick}
    />
  );
}