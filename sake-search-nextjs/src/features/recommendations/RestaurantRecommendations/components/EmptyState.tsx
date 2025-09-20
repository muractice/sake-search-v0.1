'use client';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState = ({ 
  message = 'メニューを登録すると、レコメンド機能が利用できます' 
}: EmptyStateProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
        <span className="mr-2">💡</span>
        飲食店向けレコメンド
      </h2>
      <p className="text-gray-800 font-medium text-center py-8">
        {message}
      </p>
    </div>
  );
};