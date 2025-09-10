import { SakeData } from '@/types/sake';
import { SakeDetailCard } from '@/components/sake/SakeDetailCard';
import { CHART_COLORS } from '../constants/chartColors';

interface SakeListProps {
  sakeData: SakeData[];
  onSakeClick: (sake: SakeData) => void;
  onRemove?: (sake: SakeData) => void;
  showRemoveButton?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  recordButtonLabel?: string;
}

export const SakeList = ({ 
  sakeData, 
  onSakeClick,
  onRemove,
  showRemoveButton = true,
  showDescription = true,
  showActions = true,
  recordButtonLabel = '飲んだ'
}: SakeListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sakeData.map((sake, index) => (
        <SakeDetailCard
          key={sake.id}
          sake={sake}
          index={index}
          variant="chart-list"
          backgroundColor={CHART_COLORS.solidColors[index % CHART_COLORS.solidColors.length]}
          onSelect={onSakeClick}
          onRemove={onRemove}
          showRemoveButton={showRemoveButton}
          showDescription={showDescription}
          showActions={showActions}
          recordButtonLabel={recordButtonLabel}
        />
      ))}
    </div>
  );
};