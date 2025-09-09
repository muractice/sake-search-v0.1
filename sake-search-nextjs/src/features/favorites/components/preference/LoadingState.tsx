'use client';

interface LoadingStateProps {
  className?: string;
}

export const LoadingState = ({ className = '' }: LoadingStateProps) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-bold mb-4">好み分析</h3>
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">分析中...</span>
      </div>
    </div>
  );
};