'use client';

import { SakeData } from '@/types/sake';

interface PurchaseButtonProps {
  sake: SakeData;
  className?: string;
  variant?: 'full' | 'compact';
  showLabel?: boolean;
}

export const PurchaseButton = ({ 
  sake, 
  className = '', 
  variant = 'full',
  showLabel = true 
}: PurchaseButtonProps) => {
  
  const handlePurchase = () => {
    // 将来的にはここに購入ロジックを実装
    // 例: 外部ECサイトへのリンク、カート追加機能など
    alert('準備中です');
  };

  const baseClasses = variant === 'full' 
    ? 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium'
    : 'px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium';

  return (
    <button
      onClick={handlePurchase}
      className={`${baseClasses} ${className}`}
      title={`${sake.name}を購入する`}
    >
      {showLabel && '購入する'}
      {!showLabel && '🛒'}
    </button>
  );
};