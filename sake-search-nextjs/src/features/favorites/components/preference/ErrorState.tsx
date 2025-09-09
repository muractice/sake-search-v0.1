'use client';

interface ErrorStateProps {
  error: string;
  onRefresh: () => void;
  className?: string;
}

export const ErrorState = ({ error, onRefresh, className = '' }: ErrorStateProps) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-bold mb-4">好み分析</h3>
      <div className="text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
};