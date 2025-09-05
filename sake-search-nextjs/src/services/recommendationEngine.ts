import { SakeData } from '@/types/sake';
import { PreferenceVector, UserPreference, RecommendOptions } from '@/types/preference';
import { SakeDataService } from './sakeDataService';

export class RecommendationEngine {
  private sakeDataService: SakeDataService;

  constructor() {
    this.sakeDataService = SakeDataService.getInstance();
  }

  /**
   * レコメンドの生成
   */
  async generateRecommendations(
    userPreference: UserPreference,
    options: RecommendOptions = { count: 20 }
  ): Promise<SakeRecommendation[]> {
    const recommendations: SakeRecommendation[] = [];

    // ユーザーが既にお気に入りに登録していない日本酒を取得
    const availableSakes = await this.sakeDataService.getAvailableSakes(userPreference.userId);

    const totalCount = options.count;

    // 1. 類似性ベースのレコメンド（70%）
    if (options.includeSimilar !== false) {
      const similarCount = Math.ceil(totalCount * 0.7);
      const similarSakes = this.findSimilarSakes(
        userPreference.vector,
        availableSakes,
        similarCount
      );
      recommendations.push(...similarSakes);
    }

    // 2. 探索的レコメンド（20%）
    if (options.includeExplore !== false) {
      const exploreCount = Math.ceil(totalCount * 0.2);
      const exploreSakes = this.findExploratorySakes(
        userPreference,
        availableSakes,
        exploreCount
      );
      recommendations.push(...exploreSakes);
    }

    // 3. トレンドベース（10%）
    if (options.includeTrending !== false) {
      const trendingCount = Math.ceil(totalCount * 0.1);
      const trendingSakes = await this.findTrendingSakes(
        trendingCount
      );
      recommendations.push(...trendingSakes);
    }

    // 重複除去とランキング
    return this.rankAndFilter(recommendations, options);
  }

  /**
   * 類似性ベースの日本酒を検索
   */
  private findSimilarSakes(
    preferenceVector: PreferenceVector,
    sakes: SakeData[],
    count: number
  ): SakeRecommendation[] {
    return sakes
      .map(sake => {
        const similarity = this.calculateSimilarity(preferenceVector, sake);
        return {
          sake,
          score: similarity,
          type: 'similar' as const,
          reason: this.generateSimilarityReason(preferenceVector, sake, similarity),
          similarityScore: similarity,
          predictedRating: this.predictRating(similarity)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * 探索的レコメンド（好みと少し異なるものを提案）
   */
  private findExploratorySakes(
    userPreference: UserPreference,
    sakes: SakeData[],
    count: number
  ): SakeRecommendation[] {
    // 冒険度スコアに応じて探索範囲を調整
    const explorationRadius = this.calculateExplorationRadius(userPreference.adventureScore);
    
    return sakes
      .filter(sake => {
        const distance = this.calculateDistance(
          userPreference.vector,
          this.sakeToVector(sake)
        );
        // 適度に離れたものを選択（近すぎず遠すぎず）
        return distance > explorationRadius && distance < explorationRadius + 1.5;
      })
      .map(sake => ({
        sake,
        score: this.calculateNoveltyScore(sake, userPreference),
        type: 'explore' as const,
        reason: '新しい味わいの発見におすすめ',
        similarityScore: this.calculateSimilarity(userPreference.vector, sake),
        predictedRating: this.predictRating(0.6) // 探索的なので中程度の予測
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * トレンド/人気ベースのレコメンド
   */
  private async findTrendingSakes(
    count: number
  ): Promise<SakeRecommendation[]> {
    // データベースから実際のトレンドデータを取得
    const trendingSakes = await this.sakeDataService.getTrendingSakes(count * 2);
    
    return trendingSakes
      .map(sake => ({
        sake,
        score: 0.8 + Math.random() * 0.2, // 0.8-1.0のスコア
        type: 'trending' as const,
        reason: this.generateTrendingReason(),
        similarityScore: 0.5,
        predictedRating: this.predictRating(0.75)
      }))
      .slice(0, count);
  }

  /**
   * コサイン類似度の計算
   */
  public calculateSimilarity(
    preferenceVector: PreferenceVector,
    sake: SakeData
  ): number {
    const sakeVector = this.sakeToVector(sake);
    
    // ユークリッド距離ベースの類似度計算
    // 距離が近いほど類似度が高い
    // 甘辛・淡濃を重視（重み2.0）、その他の要素は補助的（重み0.3）
    const distance = Math.sqrt(
      Math.pow(preferenceVector.sweetness - sakeVector.sweetness, 2) * 2.0 +
      Math.pow(preferenceVector.richness - sakeVector.richness, 2) * 2.0 +
      Math.pow(preferenceVector.f1_floral - sakeVector.f1_floral, 2) * 0.3 +
      Math.pow(preferenceVector.f2_mellow - sakeVector.f2_mellow, 2) * 0.3 +
      Math.pow(preferenceVector.f3_heavy - sakeVector.f3_heavy, 2) * 0.3 +
      Math.pow(preferenceVector.f4_mild - sakeVector.f4_mild, 2) * 0.3 +
      Math.pow(preferenceVector.f5_dry - sakeVector.f5_dry, 2) * 0.3 +
      Math.pow(preferenceVector.f6_light - sakeVector.f6_light, 2) * 0.3
    );
    
    // 距離を0-1の類似度に変換（距離0で類似度1、距離が大きいほど類似度0に近づく）
    // 最大距離を8と仮定（重み付け調整後の値）
    const maxDistance = 8;
    const similarity = Math.max(0, 1 - (distance / maxDistance));
    
    return similarity;
  }

  /**
   * 日本酒データをベクトルに変換
   */
  private sakeToVector(sake: SakeData): PreferenceVector {
    return {
      sweetness: sake.sweetness,
      richness: sake.richness,
      f1_floral: sake.flavorChart?.f1 || 0.5,
      f2_mellow: sake.flavorChart?.f2 || 0.5,
      f3_heavy: sake.flavorChart?.f3 || 0.5,
      f4_mild: sake.flavorChart?.f4 || 0.5,
      f5_dry: sake.flavorChart?.f5 || 0.5,
      f6_light: sake.flavorChart?.f6 || 0.5,
    };
  }

  /**
   * ベクトルの内積計算
   */
  private dotProduct(vector1: PreferenceVector, vector2: PreferenceVector): number {
    return (
      vector1.sweetness * vector2.sweetness +
      vector1.richness * vector2.richness +
      vector1.f1_floral * vector2.f1_floral +
      vector1.f2_mellow * vector2.f2_mellow +
      vector1.f3_heavy * vector2.f3_heavy +
      vector1.f4_mild * vector2.f4_mild +
      vector1.f5_dry * vector2.f5_dry +
      vector1.f6_light * vector2.f6_light
    );
  }

  /**
   * ベクトルの大きさ計算
   */
  private magnitude(vector: PreferenceVector): number {
    return Math.sqrt(
      vector.sweetness ** 2 +
      vector.richness ** 2 +
      vector.f1_floral ** 2 +
      vector.f2_mellow ** 2 +
      vector.f3_heavy ** 2 +
      vector.f4_mild ** 2 +
      vector.f5_dry ** 2 +
      vector.f6_light ** 2
    );
  }

  /**
   * 2つのベクトル間の距離計算
   */
  private calculateDistance(vector1: PreferenceVector, vector2: PreferenceVector): number {
    return Math.sqrt(
      (vector1.sweetness - vector2.sweetness) ** 2 +
      (vector1.richness - vector2.richness) ** 2 +
      (vector1.f1_floral - vector2.f1_floral) ** 2 +
      (vector1.f2_mellow - vector2.f2_mellow) ** 2 +
      (vector1.f3_heavy - vector2.f3_heavy) ** 2 +
      (vector1.f4_mild - vector2.f4_mild) ** 2 +
      (vector1.f5_dry - vector2.f5_dry) ** 2 +
      (vector1.f6_light - vector2.f6_light) ** 2
    );
  }

  /**
   * 新規性スコアの計算
   */
  private calculateNoveltyScore(sake: SakeData, userPreference: UserPreference): number {
    // 冒険度が高いほど、より離れた味を高く評価
    const distance = this.calculateDistance(
      userPreference.vector,
      this.sakeToVector(sake)
    );
    
    // 距離とユーザーの冒険度を組み合わせてスコア計算
    return Math.min(distance * (0.5 + userPreference.adventureScore * 0.5), 1);
  }

  /**
   * 類似度から予測評価を計算
   */
  private predictRating(similarity: number): number {
    // 類似度を1-5の評価に変換
    return 1 + (similarity * 4);
  }

  /**
   * 類似性の理由を生成
   */
  private generateSimilarityReason(
    preferenceVector: PreferenceVector,
    sake: SakeData,
    similarity: number
  ): string {
    const sakeVector = this.sakeToVector(sake);
    
    if (similarity > 0.9) {
      return 'あなたの好みにとても近い味わい';
    } else if (similarity > 0.7) {
      // 最も近い特性を特定
      const differences = {
        sweetness: Math.abs(preferenceVector.sweetness - sakeVector.sweetness),
        richness: Math.abs(preferenceVector.richness - sakeVector.richness),
        f1_floral: Math.abs(preferenceVector.f1_floral - sakeVector.f1_floral),
        f2_mellow: Math.abs(preferenceVector.f2_mellow - sakeVector.f2_mellow),
        f3_heavy: Math.abs(preferenceVector.f3_heavy - sakeVector.f3_heavy),
        f4_mild: Math.abs(preferenceVector.f4_mild - sakeVector.f4_mild),
        f5_dry: Math.abs(preferenceVector.f5_dry - sakeVector.f5_dry),
        f6_light: Math.abs(preferenceVector.f6_light - sakeVector.f6_light),
      };
      
      const closestFeature = Object.entries(differences)
        .sort(([,a], [,b]) => a - b)[0][0];
      
      const featureNames: Record<string, string> = {
        sweetness: '甘辛度',
        richness: '淡濃度',
        f1_floral: '華やかさ',
        f2_mellow: 'まろやかさ',
        f3_heavy: '重厚さ',
        f4_mild: '穏やかさ',
        f5_dry: 'キレ',
        f6_light: '軽快さ',
      };
      
      return `${featureNames[closestFeature]}があなたの好みと一致`;
    } else {
      return 'あなたの好みに合う可能性があります';
    }
  }

  /**
   * 結果のランキングとフィルタリング
   */
  private rankAndFilter(
    recommendations: SakeRecommendation[],
    options: RecommendOptions
  ): SakeRecommendation[] {
    // 重複除去（同じ日本酒IDの場合、より高いスコアを採用）
    const uniqueRecommendations = new Map<string, SakeRecommendation>();
    
    recommendations.forEach(rec => {
      const existing = uniqueRecommendations.get(rec.sake.id);
      if (!existing || rec.score > existing.score) {
        uniqueRecommendations.set(rec.sake.id, rec);
      }
    });

    // スコア順でソート
    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, options.count);
  }

  /**
   * 探索範囲の計算
   */
  private calculateExplorationRadius(adventureScore: number): number {
    // 冒険度が高いほど遠い味を探索
    // 0.0 -> 1.0, 0.5 -> 2.0, 1.0 -> 3.0
    return 1.0 + adventureScore * 2.0;
  }

  /**
   * トレンド理由の生成
   */
  private generateTrendingReason(): string {
    const reasons = [
      '今月の人気No.1銘柄',
      '話題の新作',
      '入手困難な希少銘柄',
      'SNSで話題の銘柄',
      '専門家も絶賛の逸品',
      '季節限定の特別な味わい'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }
}

// レコメンド結果の型
export interface SakeRecommendation {
  sake: SakeData;
  score: number;
  type: 'similar' | 'explore' | 'trending';
  reason: string;
  similarityScore: number;
  predictedRating: number;
}