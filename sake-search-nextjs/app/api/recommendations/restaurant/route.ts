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
  dishType?: string;    // 料理タイプ（pairingの場合）
  count?: number;       // 結果件数（デフォルト: 10）
}

export async function POST(request: NextRequest) {
  try {
    const body: RestaurantRecommendationRequest = await request.json();
    const { type, menuItems, dishType, count = 10 } = body;

    if (!menuItems || menuItems.length === 0) {
      return NextResponse.json(
        { error: 'Menu items are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // 日本酒データを取得
    const sakeDataService = SakeDataService.getInstance();
    const allSakes = await sakeDataService.getAllSakes();
    
    // メニューアイテムから日本酒データを取得
    const menuSakeData: SakeData[] = [];
    const notFound: string[] = [];
    
    for (const menuItem of menuItems) {
      const sake = allSakes.find(s => 
        s.name === menuItem || 
        s.name.includes(menuItem) || 
        menuItem.includes(s.name)
      );
      
      if (sake) {
        menuSakeData.push(sake);
      } else {
        notFound.push(menuItem);
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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // 未ログインの場合は人気順で返す
          recommendations = menuSakeData
            .sort(() => Math.random() - 0.5)  // 暫定的にランダム
            .slice(0, count)
            .map((sake, index) => ({
              sake,
              score: 0.9 - (index * 0.05),
              type: 'trending',
              reason: '人気の銘柄です',
              similarityScore: 0.8 - (index * 0.05),
              predictedRating: 4.0 - (index * 0.2)
            }));
        } else {
          // お気に入りデータを取得
          const { data: favorites } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id);

          if (!favorites || favorites.length < 3) {
            // お気に入りが少ない場合は人気順
            recommendations = menuSakeData
              .sort(() => Math.random() - 0.5)
              .slice(0, count)
              .map((sake, index) => ({
                sake,
                score: 0.9 - (index * 0.05),
                type: 'trending',
                reason: 'おすすめの銘柄です',
                similarityScore: 0.8 - (index * 0.05),
                predictedRating: 4.0 - (index * 0.2)
              }));
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
        // おすすめガチャ（重み付きランダム）
        recommendations = generateRandomRecommendations(
          menuSakeData,
          count
        );
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
    'general': (sake) => {
      // 一般的にはバランス型
      return 0.5 + Math.random() * 0.5;
    }
  };

  const scoringFunction = pairingRules[dishType] || pairingRules['general'];

  const scored = sakes.map(sake => ({
    sake,
    score: scoringFunction(sake),
    type: 'pairing' as const,
    reason: generatePairingReason(dishType, sake),
    similarityScore: scoringFunction(sake) / 2,
    predictedRating: 3 + scoringFunction(sake)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// ペアリング理由生成
function generatePairingReason(dishType: string, _sake: SakeData): string {
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

// ランダムレコメンド生成（重み付き）
function generateRandomRecommendations(
  sakes: SakeData[],
  count: number
) {
  // 各日本酒に重みを付ける
  const weighted = sakes.map(sake => {
    // ランダム要素 + 味わいバランススコア
    const balanceScore = Math.abs(sake.sweetness) < 2 && Math.abs(sake.richness) < 2 ? 0.3 : 0;
    const randomScore = Math.random();
    const totalScore = balanceScore + randomScore;
    
    return {
      sake,
      score: totalScore,
      type: 'random' as const,
      reason: generateRandomReason(),
      similarityScore: 0.5 + Math.random() * 0.3,
      predictedRating: 3.5 + Math.random() * 1.5
    };
  });

  // スコア順にソートしてランダム性を保ちつつ良いものを選択
  return weighted
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
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