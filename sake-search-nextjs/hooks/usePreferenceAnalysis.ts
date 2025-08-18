'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { PreferenceAnalyzer } from '@/services/preferenceAnalyzer';
import { UserPreference, PreferenceVector, TasteType } from '@/types/preference';

export function usePreferenceAnalysis() {
  const { user } = useFavoritesContext();
  const { favorites } = useFavoritesContext();
  
  const [preference, setPreference] = useState<UserPreference | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: 将来的にお気に入り変更時の自動再分析を有効化
  // useEffect(() => {
  //   if (user && favorites.length > 0) {
  //     // 3件以上で自動分析実行
  //     if (favorites.length >= 3) {
  //       analyzePreferences();
  //     } else {
  //       // 3件未満の場合は既存データをロード
  //       loadExistingPreferences();
  //     }
  //   } else if (user && favorites.length === 0) {
  //     setPreference(null);
  //   }
  // }, [user, favorites.length]);

  // 初回ロード時のみ実行（手動更新メイン）
  useEffect(() => {
    if (user && favorites.length > 0) {
      loadExistingPreferences();
    } else if (user && favorites.length === 0) {
      setPreference(null);
    }
  }, [user, favorites.length]); // favoritesの長さも監視

  // 既存データのロード専用（24時間縛りなし）
  const loadExistingPreferences = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 既存の分析結果をチェック
      const { data: existingPreference } = await supabase
        .from('user_taste_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // 既存データがあれば表示（24時間縛りなし）
      if (existingPreference) {
        const userPref: UserPreference = {
          id: existingPreference.id,
          userId: existingPreference.user_id,
          vector: {
            sweetness: existingPreference.sweetness_preference,
            richness: existingPreference.richness_preference,
            f1_floral: existingPreference.f1_preference,
            f2_mellow: existingPreference.f2_preference,
            f3_heavy: existingPreference.f3_preference,
            f4_mild: existingPreference.f4_preference,
            f5_dry: existingPreference.f5_preference,
            f6_light: existingPreference.f6_preference,
          },
          tasteType: existingPreference.taste_type as TasteType,
          diversityScore: existingPreference.diversity_score || 0,
          adventureScore: existingPreference.adventure_score || 0,
          totalFavorites: existingPreference.total_favorites || 0,
          calculatedAt: new Date(existingPreference.calculated_at),
          updatedAt: new Date(existingPreference.updated_at),
        };
        setPreference({ ...userPref });
      } else {
        // 既存データがない場合はnullを設定
        setPreference(null);
      }
    } catch (err) {
      console.error('Error loading existing preferences:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`好み分析データの読み込みに失敗しました: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // TODO: 将来的に自動再分析で使用する関数（24時間縛り付き）
  // const loadOrAnalyzePreferences = async () => {
  //   if (!user) return;
  //
  //   setLoading(true);
  //   setError(null);
  //
  //   try {
  //     // 既存の分析結果をチェック
  //     const { data: existingPreference } = await supabase
  //       .from('user_preferences')
  //       .select('*')
  //       .eq('user_id', user.id)
  //       .single();
  //
  //     // 24時間以内の分析結果があれば使用
  //     if (existingPreference && isRecentAnalysis(existingPreference.calculated_at)) {
  //       const userPref: UserPreference = {
  //         id: existingPreference.id,
  //         userId: existingPreference.user_id,
  //         vector: {
  //           sweetness: existingPreference.sweetness_preference,
  //           richness: existingPreference.richness_preference,
  //           f1_floral: existingPreference.f1_preference,
  //           f2_mellow: existingPreference.f2_preference,
  //           f3_heavy: existingPreference.f3_preference,
  //           f4_mild: existingPreference.f4_preference,
  //           f5_dry: existingPreference.f5_preference,
  //           f6_light: existingPreference.f6_preference,
  //         },
  //         tasteType: existingPreference.taste_type as TasteType,
  //         diversityScore: existingPreference.diversity_score || 0,
  //         adventureScore: existingPreference.adventure_score || 0,
  //         totalFavorites: existingPreference.total_favorites || 0,
  //         calculatedAt: new Date(existingPreference.calculated_at),
  //         updatedAt: new Date(existingPreference.updated_at),
  //       };
  //       setPreference(userPref);
  //       return;
  //     }
  //
  //     // 新規分析を実行
  //     await analyzePreferences();
  //   } catch (err) {
  //     console.error('Error loading preferences:', err);
  //     const errorMessage = err instanceof Error ? err.message : String(err);
  //     setError(`好み分析の読み込みに失敗しました: ${errorMessage}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const analyzePreferences = async () => {
    if (!user || favorites.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      console.log('=== 手動更新開始 ===');
      console.log('現在のfavorites:', favorites);
      console.log('現在のfavorites.length:', favorites.length);
      console.log('各お気に入りの詳細:', favorites.map(f => ({ 
        name: f.name, 
        sweetness: f.sweetness, 
        richness: f.richness,
        flavorChart: f.flavorChart 
      })));
      console.log('Starting preference analysis...');
      console.log('Favorites count:', favorites.length);
      console.log('Favorites data:', favorites);
      
      const analyzer = new PreferenceAnalyzer();
      
      // 好みベクトルの計算
      console.log('Calculating preference vector...');
      const vector = analyzer.calculatePreferenceVector(favorites);
      console.log('🧮 新しく計算されたベクトル:', vector);
      
      // 既存データとの比較
      if (preference) {
        console.log('📊 既存ベクトル:', preference.vector);
        console.log('🔄 ベクトルに変更があったか:', JSON.stringify(vector) !== JSON.stringify(preference.vector));
        console.log('📅 既存分析日時:', preference.calculatedAt);
        console.log('👤 既存タイプ:', preference.tasteType);
      } else {
        console.log('📝 初回分析（既存データなし）');
      }
      
      // タイプ判定
      console.log('Determining taste type...');
      const tasteType = analyzer.determineTasteType(vector);
      console.log('🏷️ 新しく判定されたタイプ:', tasteType);
      if (preference && preference.tasteType !== tasteType) {
        console.log('🔄 タイプが変更されました:', preference.tasteType, '->', tasteType);
      }
      
      // 多様性・冒険度スコア
      console.log('Calculating diversity and adventure scores...');
      const diversityScore = analyzer.calculateDiversityScore(favorites);
      const adventureScore = analyzer.calculateAdventureScore(favorites);
      console.log('📈 多様性スコア:', diversityScore, '(既存:', preference?.diversityScore, ')');
      console.log('🚀 冒険度スコア:', adventureScore, '(既存:', preference?.adventureScore, ')');

      const userPref: UserPreference = {
        id: '', // DBで生成される
        userId: user.id,
        vector,
        tasteType,
        diversityScore,
        adventureScore,
        totalFavorites: favorites.length,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      };

      // Supabaseに保存
      console.log('Saving preference data to Supabase...');
      console.log('User ID:', user.id);
      console.log('Vector:', vector);
      console.log('Taste type:', tasteType);
      
      const saveData = {
        user_id: user.id,
        sweetness_preference: vector.sweetness,
        richness_preference: vector.richness,
        f1_preference: vector.f1_floral,
        f2_preference: vector.f2_mellow,
        f3_preference: vector.f3_heavy,
        f4_preference: vector.f4_mild,
        f5_preference: vector.f5_dry,
        f6_preference: vector.f6_light,
        taste_type: tasteType,
        diversity_score: diversityScore,
        adventure_score: adventureScore,
        total_favorites: favorites.length,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('Save data:', saveData);
      
      // 認証状態を確認
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        throw new Error('認証セッションが無効です。再度ログインしてください。');
      }

      // upsert方式：既存データがあれば更新、なければ挿入
      console.log('Upserting preference data (insert or update)...');
      const { data, error: saveError } = await supabase
        .from('user_taste_preferences')
        .upsert(saveData, {
          onConflict: 'user_id'  // user_idが重複した場合は更新
        })
        .select()
        .single();

      console.log('Supabase response:', { data, error: saveError });

      if (saveError) {
        console.error('Supabase save error:', saveError);
        throw saveError;
      }

      // 保存されたデータでstateを更新
      if (data) {
        userPref.id = data.id;
        // 強制的に新しいオブジェクトとして設定してReactの再レンダリングを確実にする
        setPreference({ ...userPref });
        console.log('✅ 好み分析完了・UI更新:', {
          タイプ: userPref.tasteType,
          多様性: Math.round(userPref.diversityScore * 100) + '%',
          冒険度: Math.round(userPref.adventureScore * 100) + '%',
          更新時刻: new Date().toLocaleTimeString(),
          '🔄 React再レンダリング強制': 'スプレッド演算子でオブジェクト複製'
        });
      } else {
        console.log('❌ データ保存は成功したが、レスポンスが空です');
      }
      console.log('=== 手動更新完了 ===');
    } catch (err) {
      console.error('Error analyzing preferences:', err);
      console.error('Error type:', typeof err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Error stack:', err.stack);
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }
      
      setError(`好み分析に失敗しました: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 手動更新専用（常に再計算）
  const refreshAnalysis = async () => {
    await analyzePreferences();
  };

  // TODO: 将来的に24時間縛りを使用する場合の関数
  // const isRecentAnalysis = (calculatedAt: string): boolean => {
  //   const now = new Date();
  //   const analyzed = new Date(calculatedAt);
  //   const hoursDiff = (now.getTime() - analyzed.getTime()) / (1000 * 60 * 60);
  //   return hoursDiff < 24;
  // };

  return {
    preference,
    loading,
    error,
    refresh: refreshAnalysis, // 手動更新ボタン用
    hasEnoughData: favorites.length >= 3, // 最低3件のお気に入りで分析可能
  };
}