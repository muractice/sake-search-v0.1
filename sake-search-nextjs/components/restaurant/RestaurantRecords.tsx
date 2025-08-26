'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RestaurantDrinkingRecordDetail } from '@/types/restaurant';

export const RestaurantRecords = () => {
  const [records, setRecords] = useState<RestaurantDrinkingRecordDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // 記録を取得
  const fetchRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('restaurant_drinking_records_detail')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('record_created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching restaurant records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // 記録を削除
  const handleDelete = async (id: string, sakeName: string) => {
    if (!confirm(`「${sakeName}」の記録を削除しますか？`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('restaurant_drinking_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecords(records.filter(r => r.record_id !== id));
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-xl font-bold mb-2">飲食店記録がありません</h2>
        <p className="text-gray-600 mb-4">
          飲食店でお酒を飲んだ記録を残してみましょう
        </p>
        <p className="text-sm text-gray-500">
          「飲食店」タブでメニューを登録し、<br />
          実際に飲んだ記録を追加できます
        </p>
      </div>
    );
  }

  // 飲食店別にグループ化
  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.restaurant_name]) {
      acc[record.restaurant_name] = [];
    }
    acc[record.restaurant_name].push(record);
    return acc;
  }, {} as { [key: string]: RestaurantDrinkingRecordDetail[] });

  // 統計情報
  const totalRecords = records.length;
  const uniqueRestaurants = Object.keys(groupedRecords).length;
  const uniqueSakes = new Set(records.map(r => r.sake_id)).size;
  const averageRating = records.reduce((sum, r) => sum + r.rating, 0) / totalRecords;
  const totalSpent = records.reduce((sum, r) => sum + (r.price_paid || 0), 0);

  return (
    <div className="space-y-6">
      {/* 統計サマリー */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold flex items-center mb-4">
          <span className="mr-2">📊</span>
          飲食店記録サマリー
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalRecords}</div>
            <div className="text-sm text-gray-600">総記録数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{uniqueRestaurants}</div>
            <div className="text-sm text-gray-600">訪問店舗数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{uniqueSakes}</div>
            <div className="text-sm text-gray-600">飲んだ銘柄数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">平均評価</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              ¥{totalSpent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">総支払額</div>
          </div>
        </div>
      </div>

      {/* 飲食店別記録一覧 */}
      <div className="space-y-6">
        {Object.entries(groupedRecords).map(([restaurant, restaurantRecords]) => (
          <div key={restaurant} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <span className="mr-2">📍</span>
                {restaurant}
              </h3>
              <span className="text-sm text-gray-500">
                {restaurantRecords.length}件の記録
              </span>
            </div>

            <div className="space-y-3">
              {restaurantRecords.map(record => (
                <div
                  key={record.record_id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-500">
                          {record.date}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < record.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {record.price_paid && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            ¥{record.price_paid.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-lg mb-1">
                        {record.sake_name || record.sake_id}
                      </h4>
                      {record.sake_brewery && (
                        <p className="text-sm text-gray-600 mb-2">
                          {record.sake_brewery}
                        </p>
                      )}
                      {record.memo && (
                        <p className="text-sm text-gray-700 bg-white rounded p-2">
                          💭 {record.memo}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(record.record_id, record.sake_id)}
                      disabled={deletingId === record.record_id}
                      className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {deletingId === record.record_id ? '削除中...' : '削除'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};