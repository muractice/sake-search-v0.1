import { SakeData } from '@/types/sake';
import { CHART_COLORS } from '../constants/chartColors';

export const createChartDataset = (sakeData: SakeData[]) => {
  return {
    label: '日本酒',
    data: sakeData.map((sake) => ({
      x: sake.sweetness,
      y: sake.richness,
    })),
    backgroundColor: sakeData.map((_, index) => 
      CHART_COLORS.backgroundColor[index % CHART_COLORS.backgroundColor.length]
    ),
    borderColor: sakeData.map((_, index) => 
      CHART_COLORS.borderColor[index % CHART_COLORS.borderColor.length]
    ),
    borderWidth: 3,
    pointRadius: 12,
    pointHoverRadius: 15,
    pointHoverBackgroundColor: sakeData.map((_, index) => 
      CHART_COLORS.pointHoverBackgroundColor[index % CHART_COLORS.pointHoverBackgroundColor.length]
    ),
    pointHoverBorderColor: '#ffffff',
    pointHoverBorderWidth: 4,
    pointStyle: 'circle',
  };
};

export const createTooltipCallbacks = (sakeData: SakeData[]) => ({
  label: function(context: { dataIndex: number }): string | string[] {
    const sake = sakeData[context.dataIndex];
    if (sake && typeof sake.name === 'string') {
      return [
        sake.name,
        `蔵元: ${sake.brewery}`,
        `甘辛: ${sake.sweetness > 0 ? '甘' : '辛'} (${sake.sweetness.toFixed(1)})`,
        `淡濃: ${sake.richness > 0 ? '濃醇' : '淡麗'} (${sake.richness.toFixed(1)})`
      ];
    }
    return '';
  }
});

export const createDataLabelsConfig = () => ({
  display: true,
  color: '#ffffff',
  font: {
    weight: 'bold' as const,
    size: 16,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif'
  },
  formatter: (_value: unknown, context: { dataIndex: number }) => {
    return context.dataIndex + 1;
  },
  anchor: 'center' as const,
  align: 'center' as const,
  textStrokeColor: '#000000',
  textStrokeWidth: 6
});

export const debugSakeData = (sakeData: SakeData[]) => {
  if (typeof window !== 'undefined') {
    (window as { debugSakeData?: SakeData[] }).debugSakeData = sakeData;
  }
};