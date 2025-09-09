'use client';

interface NoDataStateProps {
  onRefresh: () => void;
  className?: string;
}

export const NoDataState = ({ onRefresh, className = '' }: NoDataStateProps) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-bold mb-4">好み分析</h3>
      <div className="text-center">
        <p className="text-gray-600 mb-4">好み分析データがありません</p>
        <button
          onClick={onRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          分析開始
        </button>
      </div>
    </div>
  );
};