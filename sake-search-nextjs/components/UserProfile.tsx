'use client';

import { useFavoritesContext } from '@/contexts/FavoritesContext';

import { SakeData } from '@/types/sake';

interface UserProfileProps {
  onShowAuth: () => void;
  onAddToComparison?: (sake: SakeData) => void;
  isInComparison?: (sakeId: string) => boolean;
  onSelectSake?: (sake: SakeData) => void;
}

export const UserProfile = ({ onShowAuth, onAddToComparison, isInComparison, onSelectSake }: UserProfileProps) => {
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
              <h3 className="text-lg font-bold text-gray-900">ユーザー情報</h3>
              <p className="text-gray-800 text-sm font-medium">{user.email}</p>
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
              <span className="text-sm font-semibold text-gray-800">お気に入り数</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">
                {favorites.length}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">お気に入り表示</span>
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
              <h4 className="text-sm font-bold mb-2 text-gray-900">お気に入り一覧</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {favorites.slice(0, 5).map((sake) => {
                  const isAdded = isInComparison?.(sake.id) || false;
                  return (
                    <div 
                      key={sake.id} 
                      className={`text-xs p-2 rounded transition-all duration-200 cursor-pointer ${
                        isAdded 
                          ? 'bg-blue-100 border border-blue-300 hover:bg-blue-200' 
                          : 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        onAddToComparison?.(sake);
                        onSelectSake?.(sake);
                      }}
                      title={isAdded ? 'クリックして比較リストから削除' : 'クリックして比較リストに追加'}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{sake.name}</div>
                          <div className="text-gray-700 font-medium">{sake.brewery}</div>
                        </div>
                        <div className="ml-2">
                          {isAdded ? (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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