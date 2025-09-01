import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { RecommendationEngine } from '@/services/recommendationEngine';
import { PreferenceAnalyzer } from '@/services/preferenceAnalyzer';
import { SakeDataService } from '@/services/sakeDataService';
import { SakeData } from '@/types/sake';

export type RestaurantRecommendationType = 'similarity' | 'pairing' | 'random';

interface RestaurantRecommendationRequest {
  type: RestaurantRecommendationType;
  menuItems: string[];  // 利用可能な日本酒名リスト
  restaurantMenuSakeData?: SakeData[];  // 飲食店のメニュー日本酒データ（直接提供）
  dishType?: string;    // 料理タイプ（pairingの場合）
  count?: number;       // 結果件数（デフォルト: 10）
}

export async function POST(request: NextRequest) {
  try {
    const body: RestaurantRecommendationRequest = await request.json();
    const { type, menuItems, restaurantMenuSakeData, dishType, count = 10 } = body;

    if (!menuItems || menuItems.length === 0) {
      return NextResponse.json(
        { error: 'Menu items are required' },
        { status: 400 }
      );
    }

    console.log('🔧 Creating Supabase client...');
    
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    
    console.log('🔧 Supabaseクライアント作成完了');
    
    // 日本酒データを取得（お気に入り分析でも必要）
    const sakeDataService = SakeDataService.getInstance();
    const allSakes = await sakeDataService.getAllSakes();
    
    // 飲食店のメニューデータを直接使用（フォールバック）
    let menuSakeData: SakeData[] = [];
    const notFound: string[] = [];
    
    if (restaurantMenuSakeData && restaurantMenuSakeData.length > 0) {
      // 飲食店のメニューデータが提供された場合はそれを直接使用
      menuSakeData = restaurantMenuSakeData;
      console.log('🍽️ Using restaurant menu sake data directly:', menuSakeData.length);
    } else {
      // フォールバック: 従来の方式でデータベースから検索
      console.log('📚 Fallback: searching in database:', allSakes.length);
      
      for (const menuItem of menuItems) {
        // スペースを除去して正規化
        const normalizedMenuItem = menuItem.replace(/\s+/g, '').toLowerCase();
        
        const sake = allSakes.find(s => {
          const normalizedSakeName = s.name.replace(/\s+/g, '').toLowerCase();
          return normalizedSakeName === normalizedMenuItem || 
                 normalizedSakeName.includes(normalizedMenuItem) || 
                 normalizedMenuItem.includes(normalizedSakeName);
        });
        
        if (sake && !menuSakeData.some(m => m.id === sake.id)) {
          menuSakeData.push(sake);
        } else if (!sake) {
          notFound.push(menuItem);
        }
      }
    }

    if (menuSakeData.length === 0) {
      return NextResponse.json(
        { error: 'No sake data found for menu items' },
        { status: 404 }
      );
    }

    let recommendations = [];

    switch (type) {
      case 'similarity': {
        // ユーザーの好みに基づくレコメンド
        console.log('🔐 認証取得を開始...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        console.log('🔍 認証結果:', {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          authError: authError?.message
        });
        
        if (!user || authError) {
          // 未ログインの場合はお気に入り登録を促す
          console.log('🚫 Restaurant recommendations: User not logged in', { authError });
          return NextResponse.json({
            recommendations: [],
            notFound,
            totalFound: menuSakeData.length,
            requiresMoreFavorites: true,
            message: 'レコメンド機能を利用するにはログインが必要です'
          });
        } else {
          // お気に入りデータを取得
          const { data: favorites } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id);

          console.log(`👤 Restaurant recommendations for user ${user.id}:`, {
            favoritesCount: favorites?.length || 0,
            menuItemsCount: menuSakeData.length,
            type: type
          });

          if (!favorites || favorites.length < 3) {
            // お気に入りが少ない場合はお気に入り登録を促す
            console.log(`⚠️ Not enough favorites: ${favorites?.length || 0}/3`);
            return NextResponse.json({
              recommendations: [],
              notFound,
              totalFound: menuSakeData.length,
              requiresMoreFavorites: true,
              favoritesCount: favorites?.length || 0,
              message: `レコメンド機能を利用するには、お気に入りを3件以上登録してください（現在${favorites?.length || 0}件）。お店のメニューから選択、または「日本酒を調べる」タブで他の日本酒を探してみてください。`
            });
          } else {
            // 好み分析を実行
            const analyzer = new PreferenceAnalyzer();
            const favoriteSakes = favorites
              .map(f => allSakes.find(s => s.id === f.sake_id))
              .filter(Boolean) as SakeData[];
            
            const preferenceVector = analyzer.calculatePreferenceVector(
              favoriteSakes.map(s => ({ ...s, createdAt: new Date() }))
            );
            
            // レコメンドエンジンで類似度計算
            const engine = new RecommendationEngine();
            
            // メニューの日本酒のみでレコメンドを生成
            const similarityScores = menuSakeData.map(sake => {
              const similarity = engine.calculateSimilarity(preferenceVector, sake);
              return {
                sake,
                score: similarity,
                type: 'similar' as const,
                reason: generateSimilarityReason(similarity),
                similarityScore: similarity,
                predictedRating: 1 + (similarity * 4)
              };
            });

            recommendations = similarityScores
              .sort((a, b) => b.score - a.score)
              .slice(0, count);
            
            console.log(`✅ Similarity recommendations:`, {
              userId: user.id,
              menuItemsRequested: menuItems.length,
              menuSakeDataFound: menuSakeData.length,
              notFound: notFound.length,
              notFoundItems: notFound,
              requestedCount: count,
              actualRecommendations: recommendations.length
            });
          }
        }
        break;
      }

      case 'pairing': {
        // 料理とのペアリング（簡易実装）
        recommendations = generatePairingRecommendations(
          menuSakeData,
          dishType || 'general',
          count
        );
        break;
      }

      case 'random': {
        // おすすめガチャ（完全ランダムで1つだけ）
        if (menuSakeData.length === 0) {
          return NextResponse.json({
            recommendations: [],
            notFound,
            totalFound: 0,
            error: 'メニューに日本酒がありません'
          });
        }
        
        // 完全ランダムで1つ選択
        const randomIndex = Math.floor(Math.random() * menuSakeData.length);
        const selectedSake = menuSakeData[randomIndex];
        
        recommendations = [{
          sake: selectedSake,
          score: 1.0,
          type: 'random' as const,
          reason: generateRandomReason(),
          similarityScore: 0.5 + Math.random() * 0.3,
          predictedRating: 3.5 + Math.random() * 1.5
        }];
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid recommendation type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      recommendations,
      notFound,
      totalFound: menuSakeData.length
    });

  } catch (error) {
    console.error('Error in restaurant recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 類似度に基づく理由生成
function generateSimilarityReason(similarity: number): string {
  if (similarity > 0.9) {
    return 'あなたの好みにぴったりの一本';
  } else if (similarity > 0.8) {
    return 'あなたの好みに非常に近い味わい';
  } else if (similarity > 0.7) {
    return 'お気に入りと似た特徴があります';
  } else if (similarity > 0.6) {
    return 'バランスの良い味わいです';
  } else {
    return '新しい味わいの発見におすすめ';
  }
}

// 料理ペアリングレコメンド生成
function generatePairingRecommendations(
  sakes: SakeData[],
  dishType: string,
  count: number
) {
  // ペアリングルール定義
  const pairingRules: Record<string, (sake: SakeData) => number> = {
    'sashimi': (sake) => {
      // 刺身には淡麗・軽快系
      const score = (sake.richness < 0 ? 1 : 0.5) + (sake.flavorChart?.f6 || 0.5);
      return score;
    },
    'grilled': (sake) => {
      // 焼き物には重厚・キレ系
      const score = (sake.richness > 0 ? 1 : 0.5) + (sake.flavorChart?.f5 || 0.5);
      return score;
    },
    'fried': (sake) => {
      // 揚げ物にはキレ・辛口系
      const score = (sake.sweetness < 0 ? 1 : 0.5) + (sake.flavorChart?.f5 || 0.5);
      return score;
    },
    'soup': (sake) => {
      // 汁物には穏やか・まろやか系
      const score = (sake.flavorChart?.f2 || 0.5) + (sake.flavorChart?.f4 || 0.5);
      return score;
    },
    'dessert': (sake) => {
      // デザートには甘口・華やか系
      const score = (sake.sweetness > 0 ? 1 : 0.5) + (sake.flavorChart?.f1 || 0.5);
      return score;
    },
    'general': () => {
      // 一般的にはバランス型
      return 0.5 + Math.random() * 0.5;
    }
  };

  const scoringFunction = pairingRules[dishType] || pairingRules['general'];

  const scored = sakes.map((sake) => ({
    sake,
    score: scoringFunction(sake),
    type: 'pairing' as const,
    reason: generatePairingReason(dishType),
    similarityScore: scoringFunction(sake) / 2,
    predictedRating: 3 + scoringFunction(sake)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// ペアリング理由生成
function generatePairingReason(dishType: string): string {
  const reasons: Record<string, string> = {
    'sashimi': '刺身の繊細な味わいを引き立てます',
    'grilled': '焼き物の香ばしさと相性抜群',
    'fried': '揚げ物の油をさっぱりと流します',
    'soup': '汁物の温かさに寄り添う優しい味わい',
    'dessert': 'デザートと楽しむ贅沢な時間に',
    'general': '幅広い料理と合わせやすい万能タイプ'
  };
  
  return reasons[dishType] || reasons['general'];
}


// ランダムレコメンド理由生成
function generateRandomReason(): string {
  const reasons = [
    '本日のラッキー酒',
    '隠れた名酒を発見',
    '新しい味わいとの出会い',
    'スタッフおすすめの一本',
    '今宵の特別な一杯',
    '運命の出会いかも？',
    '気分転換にぴったり',
    '話題作りにもってこい'
  ];
  
  return reasons[Math.floor(Math.random() * reasons.length)];
}