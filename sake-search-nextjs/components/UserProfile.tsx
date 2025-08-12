'use client';

import { useFavoritesContext } from '@/contexts/FavoritesContext';

interface UserProfileProps {
  onShowAuth: () => void;
}

export const UserProfile = ({ onShowAuth }: UserProfileProps) => {
  const { 
    user, 
    favorites, 
    showFavorites, 
    toggleShowFavorites, 
    signOut 
  } = useFavoritesContext();

  return (
    <div className="bg-white p-4 rounded-lg shadow-md relative">
      {!user ? (
        // 非ログイン状態
        <>
          <h3 className="text-lg font-semibold mb-3">ユーザー認証</h3>
          <p className="text-gray-600 mb-4">
            お気に入りの日本酒を保存するためにログインしてください
          </p>
          <button
            onClick={onShowAuth}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            ログイン / サインアップ
          </button>
        </>
      ) : (
        // ログイン状態  
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">ユーザー情報</h3>
              <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              ログアウト
            </button>
          </div>
      
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">お気に入り数</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {favorites.length}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">お気に入り表示</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavorites}
                  onChange={toggleShowFavorites}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {favorites.length > 0 && showFavorites && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">お気に入り一覧</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {favorites.slice(0, 5).map((sake) => (
                  <div key={sake.id} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-medium">{sake.name}</div>
                    <div className="text-gray-500">{sake.brewery}</div>
                  </div>
                ))}
                {favorites.length > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    他 {favorites.length - 5} 件
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};