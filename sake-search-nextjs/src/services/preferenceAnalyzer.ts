import { SakeData } from '@/types/sake';
import { PreferenceVector, TasteType, PreferenceAnalysisOptions } from '@/types/preference';

export class PreferenceAnalyzer {
  private options: Required<PreferenceAnalysisOptions>;

  constructor(options: PreferenceAnalysisOptions = {}) {
    this.options = {
      timeDecayDays: options.timeDecayDays ?? 30,
      minFavorites: options.minFavorites ?? 1,
      maxFavorites: options.maxFavorites ?? 50,
    };
  }

  /**
   * お気に入りリストから好みベクトルを計算
   */
  calculatePreferenceVector(favorites: (SakeData & { createdAt?: Date })[]): PreferenceVector {
    if (favorites.length === 0) {
      return this.getDefaultVector();
    }

    // 最新のお気に入りを優先的に使用
    const recentFavorites = favorites
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, this.options.maxFavorites);

    // 重みの計算（最近のものほど重視）
    const weights = this.calculateWeights(recentFavorites);
    
    // 重み付き平均の計算
    const weightedSum = this.calculateWeightedSum(recentFavorites, weights);
    
    return this.normalizeVector(weightedSum, weights.reduce((a, b) => a + b, 0));
  }

  /**
   * 重みの計算（最近のものほど重視）
   */
  private calculateWeights(favorites: (SakeData & { createdAt?: Date })[]): number[] {
    const now = Date.now();
    return favorites.map(sake => {
      if (!sake.createdAt) return 1.0; // createdAtがない場合は基本重み
      
      const age = now - new Date(sake.createdAt).getTime();
      const daysSince = age / (1000 * 60 * 60 * 24);
      
      // 指数関数的減衰（半減期は設定された日数）
      return Math.exp(-daysSince / this.options.timeDecayDays);
    });
  }

  /**
   * 重み付きの合計値を計算
   */
  private calculateWeightedSum(
    favorites: SakeData[], 
    weights: number[]
  ): Omit<PreferenceVector, 'diversity_score' | 'adventure_score'> {
    let sweetnessSum = 0;
    let richnessSum = 0;
    let f1Sum = 0, f2Sum = 0, f3Sum = 0, f4Sum = 0, f5Sum = 0, f6Sum = 0;

    favorites.forEach((sake, index) => {
      const weight = weights[index];
      
      sweetnessSum += sake.sweetness * weight;
      richnessSum += sake.richness * weight;
      
      if (sake.flavorChart) {
        f1Sum += sake.flavorChart.f1 * weight;
        f2Sum += sake.flavorChart.f2 * weight;
        f3Sum += sake.flavorChart.f3 * weight;
        f4Sum += sake.flavorChart.f4 * weight;
        f5Sum += sake.flavorChart.f5 * weight;
        f6Sum += sake.flavorChart.f6 * weight;
      }
    });

    return {
      sweetness: sweetnessSum,
      richness: richnessSum,
      f1_floral: f1Sum,
      f2_mellow: f2Sum,
      f3_heavy: f3Sum,
      f4_mild: f4Sum,
      f5_dry: f5Sum,
      f6_light: f6Sum,
    };
  }

  /**
   * ベクトルの正規化
   */
  private normalizeVector(
    weightedSum: Omit<PreferenceVector, 'diversity_score' | 'adventure_score'>, 
    totalWeight: number
  ): PreferenceVector {
    return {
      sweetness: this.clamp(weightedSum.sweetness / totalWeight, -5, 5),
      richness: this.clamp(weightedSum.richness / totalWeight, -5, 5),
      f1_floral: this.clamp(weightedSum.f1_floral / totalWeight, 0, 1),
      f2_mellow: this.clamp(weightedSum.f2_mellow / totalWeight, 0, 1),
      f3_heavy: this.clamp(weightedSum.f3_heavy / totalWeight, 0, 1),
      f4_mild: this.clamp(weightedSum.f4_mild / totalWeight, 0, 1),
      f5_dry: this.clamp(weightedSum.f5_dry / totalWeight, 0, 1),
      f6_light: this.clamp(weightedSum.f6_light / totalWeight, 0, 1),
    };
  }

  /**
   * デフォルトの好みベクトル
   */
  private getDefaultVector(): PreferenceVector {
    return {
      sweetness: 0,
      richness: 0,
      f1_floral: 0.5,
      f2_mellow: 0.5,
      f3_heavy: 0.5,
      f4_mild: 0.5,
      f5_dry: 0.5,
      f6_light: 0.5,
    };
  }

  /**
   * 味覚タイプの判定
   */
  determineTasteType(vector: PreferenceVector): TasteType {
    const scores = {
      floral: vector.f1_floral,
      mellow: vector.f2_mellow,
      heavy: vector.f3_heavy,
      mild: vector.f4_mild,
      dry: vector.f5_dry,
      light: vector.f6_light
    };

    // 最も高いスコアのタイプを選択
    const maxScore = Math.max(...Object.values(scores));
    const dominantType = Object.entries(scores)
      .find(([, score]) => score === maxScore)?.[0] as TasteType;

    // バランス型の判定（標準偏差が小さい場合）
    const stdDev = this.calculateStandardDeviation(Object.values(scores));
    if (stdDev < 0.15) return 'balanced';

    // 冒険家型の判定（個別で実装）
    return dominantType || 'balanced';
  }

  /**
   * 多様性スコアの計算
   */
  calculateDiversityScore(favorites: SakeData[]): number {
    if (favorites.length < 2) return 0;

    // 各日本酒間の距離を計算
    const distances: number[] = [];
    for (let i = 0; i < favorites.length; i++) {
      for (let j = i + 1; j < favorites.length; j++) {
        distances.push(this.calculateDistance(favorites[i], favorites[j]));
      }
    }

    // 平均距離を0-1に正規化
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    return Math.min(avgDistance / 5, 1); // 最大距離5で正規化
  }

  /**
   * 冒険度スコアの計算
   */
  calculateAdventureScore(favorites: SakeData[]): number {
    if (favorites.length === 0) return 0;

    // 酒蔵の多様性
    const uniqueBreweries = new Set(favorites.map(sake => sake.brewery)).size;
    const breweryDiversity = Math.min(uniqueBreweries / 10, 1); // 10蔵で最大

    // 味覚の多様性
    const tasteDiversity = this.calculateDiversityScore(favorites);

    // 重み付き平均
    return (breweryDiversity * 0.4 + tasteDiversity * 0.6);
  }

  /**
   * 2つの日本酒間の距離を計算
   */
  private calculateDistance(sake1: SakeData, sake2: SakeData): number {
    const dx = sake1.sweetness - sake2.sweetness;
    const dy = sake1.richness - sake2.richness;
    
    let flavorDistance = 0;
    if (sake1.flavorChart && sake2.flavorChart) {
      const f1_diff = sake1.flavorChart.f1 - sake2.flavorChart.f1;
      const f2_diff = sake1.flavorChart.f2 - sake2.flavorChart.f2;
      const f3_diff = sake1.flavorChart.f3 - sake2.flavorChart.f3;
      const f4_diff = sake1.flavorChart.f4 - sake2.flavorChart.f4;
      const f5_diff = sake1.flavorChart.f5 - sake2.flavorChart.f5;
      const f6_diff = sake1.flavorChart.f6 - sake2.flavorChart.f6;
      
      flavorDistance = Math.sqrt(
        f1_diff ** 2 + f2_diff ** 2 + f3_diff ** 2 + 
        f4_diff ** 2 + f5_diff ** 2 + f6_diff ** 2
      );
    }

    return Math.sqrt(dx ** 2 + dy ** 2 + flavorDistance ** 2);
  }

  /**
   * 標準偏差の計算
   */
  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => (value - avg) ** 2);
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * 値を指定された範囲にクランプ
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}