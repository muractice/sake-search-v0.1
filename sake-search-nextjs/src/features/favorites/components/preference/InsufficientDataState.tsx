'use client';

interface InsufficientDataStateProps {
  className?: string;
}

export const InsufficientDataState = ({ className = '' }: InsufficientDataStateProps) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-bold mb-4">好み分析</h3>
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          好み分析を行うには、3件以上のお気に入り登録が必要です
        </p>
        <p className="text-sm text-gray-500">
          気になる日本酒をお気に入りに追加してみてください
        </p>
      </div>
    </div>
  );
};