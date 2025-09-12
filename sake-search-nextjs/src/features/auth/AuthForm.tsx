'use client';

import { useState } from 'react';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';

interface AuthFormProps {
  onClose?: () => void;
}

export const AuthForm = ({ onClose }: AuthFormProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signInWithEmail, signUpWithEmail } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setMessage('確認メールを送信しました。メールを確認してアカウントを有効化してください。');
      } else {
        await signInWithEmail(email, password);
        setMessage('ログインしました');
        setTimeout(() => {
          onClose?.();
        }, 1000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Invalid login credentials')) {
        setMessage('メールアドレスまたはパスワードが正しくありません');
      } else if (errorMessage.includes('User already registered')) {
        setMessage('このメールアドレスは既に登録されています');
      } else {
        setMessage(isSignUp ? 'サインアップに失敗しました' : 'ログインに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-auto relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="閉じる"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <h2 className="text-xl font-bold mb-5 text-center pr-6">
        {isSignUp ? 'アカウント作成' : 'ログイン'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="example@email.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="6文字以上"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm mt-4"
        >
          {isLoading ? '処理中...' : (isSignUp ? 'アカウント作成' : 'ログイン')}
        </button>
      </form>
      
      {message && (
        <div className={`mt-3 p-2.5 rounded-md text-xs ${
          message.includes('失敗') || message.includes('正しくありません') || message.includes('既に登録')
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
      
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {isSignUp ? 'ログインはこちら' : 'アカウント作成はこちら'}
        </button>
      </div>
      
      {onClose && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
};
