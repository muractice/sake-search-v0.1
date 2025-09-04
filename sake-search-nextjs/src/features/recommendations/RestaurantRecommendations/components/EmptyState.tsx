'use client';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState = ({ 
  message = 'メニューを登録すると、レコメンド機能が利用できます' 
}: EmptyStateProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">💡</span>
        飲食店向けレコメンド
      </h2>
      <p className="text-gray-500 text-center py-8">
        {message}
      </p>
    </div>
  );
};