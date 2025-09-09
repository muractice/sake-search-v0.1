import { SakeData } from '@/types/sake';
import { SakeListItem } from './SakeListItem';

interface SakeListProps {
  sakeData: SakeData[];
  onSakeClick: (sake: SakeData) => void;
}

export const SakeList = ({ sakeData, onSakeClick }: SakeListProps) => {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {sakeData.map((sake, index) => (
        <SakeListItem
          key={sake.id}
          sake={sake}
          index={index}
          onClick={() => onSakeClick(sake)}
        />
      ))}
    </div>
  );
};