'use client';

interface ScanResultsListProps {
  foundSakeNames: string[];
  sakeStatus: Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>;
  onSakeFound: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onMultipleSakeFound?: (sakeNames: string[]) => void;
  onRemoveFromComparison?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onRemoveSake: (index: number, name: string) => void;
  setSakeStatus: React.Dispatch<React.SetStateAction<Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>>>;
}

import { useState } from 'react';

export default function ScanResultsList({
  foundSakeNames,
  sakeStatus,
  onSakeFound,
  onMultipleSakeFound,
  onRemoveFromComparison,
  onRemoveSake,
  setSakeStatus
}: ScanResultsListProps) {
  const [showNotFoundMessage, setShowNotFoundMessage] = useState(false);
  const handleAddSake = async (name: string) => {
    try {
      const result = await onSakeFound(name);
      setSakeStatus(prev => new Map(prev).set(name, {
        status: result.success ? 'added' : 
                result.message.includes('見つかりませんでした') ? 'not_found' :
                result.message.includes('既に比較リストにあります') ? 'added' :
                result.message.includes('4件まで') || result.message.includes('削除してから') ? 'limit_exceeded' : 'not_found',
        message: result.message
      }));
    } catch {
      setSakeStatus(prev => new Map(prev).set(name, {
        status: 'not_found',
        message: 'エラーが発生しました'
      }));
    }
  };

  const handleRemoveSake = async (name: string) => {
    if (onRemoveFromComparison) {
      try {
        const result = await onRemoveFromComparison(name);
        if (result.success) {
          setSakeStatus(prev => new Map(prev).set(name, {
            status: 'pending',
            message: undefined
          }));
        }
      } catch (err) {
        console.error('削除エラー:', err);
      }
    }
  };

  const handleAddAll = async () => {
    if (onMultipleSakeFound) {
      // 各日本酒を個別に処理して状態を更新
      const results = await Promise.all(
        foundSakeNames.map(async (name) => {
          try {
            const result = await onSakeFound(name);
            return { name, result };
          } catch {
            return { name, result: { success: false, message: 'エラーが発生しました' } };
          }
        })
      );
      
      // 状態を一括更新
      setSakeStatus(prev => {
        const newStatus = new Map(prev);
        results.forEach(({ name, result }) => {
          newStatus.set(name, {
            status: result.success ? 'added' : 
                    result.message.includes('見つかりませんでした') ? 'not_found' :
                    result.message.includes('既に比較リストにあります') ? 'added' :
                    result.message.includes('10件まで') || result.message.includes('削除してから') ? 'limit_exceeded' : 'not_found',
            message: result.message
          });
        });
        return newStatus;
      });
      
      // データが見つかった日本酒のみを比較リストに追加
      const successfulSakes = results
        .filter(({ result }) => result.success)
        .map(({ name }) => name);
      
      // データが見つからなかった日本酒がある場合、メッセージを表示
      const notFoundSakes = results.filter(({ result }) => 
        !result.success && result.message.includes('見つかりませんでした')
      );
      if (notFoundSakes.length > 0) {
        setShowNotFoundMessage(true);
        // 3秒後にメッセージを非表示
        setTimeout(() => setShowNotFoundMessage(false), 3000);
      }
      
      if (successfulSakes.length > 0) {
        onMultipleSakeFound(successfulSakes);
      }
    } else {
      foundSakeNames.forEach(name => handleAddSake(name));
    }
  };

  if (foundSakeNames.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-green-50 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-green-800">見つかった日本酒 ({foundSakeNames.length}件):</h3>
        <button
          onClick={handleAddAll}
          className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors"
        >
          🎯 全て比較に追加
        </button>
      </div>
      
      {showNotFoundMessage && (
        <div className="mb-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
          <p className="text-sm text-orange-800">
            ⚠️ 一部の日本酒はデータベースに見つかりませんでした。
            データがある日本酒のみ比較リストに追加されました。
          </p>
        </div>
      )}
      <div className="space-y-2">
        {foundSakeNames.map((name, index) => {
          const status = sakeStatus.get(name)?.status || 'pending';
          
          const getStatusColor = () => {
            switch (status) {
              case 'added': return 'bg-green-50 border-green-300';
              case 'not_found': return 'bg-orange-50 border-orange-300';
              case 'limit_exceeded': return 'bg-white';
              default: return 'bg-white';
            }
          };
          
          const getStatusIcon = () => {
            switch (status) {
              case 'added': return '✓ 追加済み';
              case 'not_found': return '❌ データなし';
              case 'limit_exceeded': return '';
              default: return '';
            }
          };
          
          return (
            <div key={index} className={`flex justify-between items-center p-2 rounded border ${getStatusColor()}`}>
              <span className="font-semibold text-gray-900 flex items-center gap-2">
                {name}
                {status !== 'pending' && (
                  <span className={`text-sm font-medium ${
                    status === 'added' ? 'text-green-700' : 
                    status === 'not_found' ? 'text-orange-700' : 
                    'text-red-700'
                  }`}>
                    {getStatusIcon()}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                {status === 'added' ? (
                  <button
                    onClick={() => handleRemoveSake(name)}
                    className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    比較から削除
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddSake(name)}
                    disabled={status === 'not_found'}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      status === 'not_found'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {status === 'not_found' ? '❌ データなし' : '比較に追加'}
                  </button>
                )}
                <button
                  onClick={() => onRemoveSake(index, name)}
                  className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}