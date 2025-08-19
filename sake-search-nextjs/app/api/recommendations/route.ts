import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { RecommendationEngine } from '@/services/recommendationEngine';
import { PreferenceAnalyzer } from '@/services/preferenceAnalyzer';
import { SakeDataService } from '@/services/sakeDataService';
import { SakeData } from '@/types/sake';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const mood = searchParams.get('mood') || 'usual';
    const count = parseInt(searchParams.get('count') || '20');
    const includeCache = searchParams.get('cache') !== 'false';

    // キャッシュチェック（moodごとに分ける）
    if (includeCache) {
      const { data: cachedData } = await supabase
        .from('recommendation_cache')
        .select('*')
        .eq('user_id', user.id)
        .eq('mood', mood)  // moodでフィルタリング
        .gt('expires_at', new Date().toISOString())
        .order('similarity_score', { ascending: false })
        .limit(count);

      if (cachedData && cachedData.length > 0) {
        // キャッシュから日本酒データを復元
        const sakeDataService = SakeDataService.getInstance();
        const allSakes = await sakeDataService.getAllSakes();
        const sakeMap = new Map(allSakes.map(s => [s.id, s]));
        
        const recommendations = cachedData
          .map(cache => {
            const sake = sakeMap.get(cache.sake_id);
            if (!sake) return null;
            return {
              sake,
              score: cache.similarity_score,
              type: cache.recommendation_type,
              reason: cache.recommendation_reason,
              similarityScore: cache.similarity_score,
              predictedRating: cache.predicted_rating
            };
          })
          .filter(Boolean);

        return NextResponse.json({ 
          recommendations,
          fromCache: true 
        });
      }
    }

    // ユーザーのお気に入りを取得
    const { data: favorites } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id);

    if (!favorites || favorites.length < 3) {
      return NextResponse.json(
        { error: 'Not enough favorites for recommendations' },
        { status: 400 }
      );
    }

    // 好み分析を実行
    const analyzer = new PreferenceAnalyzer();
    const sakeDataService = SakeDataService.getInstance();
    const allSakes = await sakeDataService.getAllSakes();
    const sakeMap = new Map(allSakes.map(s => [s.id, s]));
    
    const favoriteSakes = favorites
      .map(f => {
        const sake = sakeMap.get(f.sake_id);
        if (!sake) return null;
        return { ...sake, createdAt: new Date(f.created_at) };
      })
      .filter(Boolean) as (SakeData & { createdAt: Date })[];
    
    const preferenceVector = analyzer.calculatePreferenceVector(favoriteSakes);
    
    const preference = {
      id: crypto.randomUUID(),
      userId: user.id,
      vector: preferenceVector,
      adventureScore: 0.5, // デフォルト値
      tasteType: analyzer.determineTasteType(preferenceVector),
      diversityScore: 0.5,
      totalFavorites: favoriteSakes.length,
      calculatedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!preference) {
      return NextResponse.json(
        { error: 'Not enough data for recommendations' },
        { status: 400 }
      );
    }

    // レコメンド生成
    const engine = new RecommendationEngine();
    const recommendations = await engine.generateRecommendations(
      preference,
      {
        count,
        mood: mood as 'usual' | 'adventure' | 'discovery' | 'special',
        includeSimilar: true,
        includeExplore: true,
        includeTrending: true
      }
    );

    // キャッシュに保存
    if (recommendations.length > 0) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 12);

      const cacheData = recommendations.map(rec => ({
        user_id: user.id,
        sake_id: rec.sake.id,
        similarity_score: rec.similarityScore,
        predicted_rating: rec.predictedRating,
        recommendation_type: rec.type,
        recommendation_reason: rec.reason,
        mood: mood,  // moodを保存
        expires_at: expiresAt.toISOString(),
      }));

      await supabase
        .from('recommendation_cache')
        .upsert(cacheData, { onConflict: 'user_id,sake_id' });
    }

    return NextResponse.json({ 
      recommendations,
      fromCache: false 
    });
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // キャッシュクリア
    const { error } = await supabase
      .from('recommendation_cache')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Cache cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}