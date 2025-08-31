'use client';

import { useState } from 'react';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

interface UserProfileProps {
  onShowAuth: () => void;
}

export const UserProfile = ({ onShowAuth }: UserProfileProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const { user, signOut } = useFavoritesContext();

  const handleMenuClick = () => {
    if (!user) {
      onShowAuth();
    } else {
      setShowMenu(!showMenu);
    }
  };

  const handleSignOut = () => {
    signOut();
    setShowMenu(false);
  };

  return (
    <div className="relative">
      {/* アイコンボタン */}
      <button
        onClick={handleMenuClick}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors border border-white/30"
        title={user ? 'ユーザーメニュー' : 'ログイン'}
      >
        {user ? (
          <span className="text-white text-lg">👤</span>
        ) : (
          <span className="text-white text-sm font-medium">🔐</span>
        )}
      </button>

      {/* ドロップダウンメニュー */}
      {showMenu && user && (
        <>
          {/* 背景オーバーレイ */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* メニュー */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* ユーザー情報 */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">👤</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">ログイン中</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* メニューアイテム */}
            <div className="py-1">
              <button
                onClick={() => {
                  // 会員情報確認機能は今後実装
                  alert('会員情報確認機能は準備中です');
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <span className="text-gray-400">ℹ️</span>
                会員情報の確認
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <span className="text-red-400">🚪</span>
                ログアウト
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};