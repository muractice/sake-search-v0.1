import { SakeData } from '@/types/sake';
import { CHART_COLORS } from '../constants/chartColors';

interface SakeListItemProps {
  sake: SakeData;
  index: number;
  onClick: () => void;
}

export const SakeListItem = ({ sake, index, onClick }: SakeListItemProps) => {
  const backgroundColor = CHART_COLORS.backgroundColor[index % CHART_COLORS.backgroundColor.length];
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center space-x-3"
    >
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor }}
      >
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{sake.name}</div>
        <div className="text-sm text-gray-600">{sake.brewery}</div>
        <div className="text-xs text-gray-500 mt-1">
          甘辛: {sake.sweetness > 0 ? '甘' : '辛'} ({sake.sweetness.toFixed(1)}) | 
          淡濃: {sake.richness > 0 ? '濃醇' : '淡麗'} ({sake.richness.toFixed(1)})
        </div>
      </div>
    </button>
  );
};