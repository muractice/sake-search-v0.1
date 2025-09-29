// Types for preference analysis and recommendation system

export interface PreferenceVector {
  sweetness: number;      // -5 to +5
  richness: number;       // -5 to +5
  f1_floral: number;      // 0 to 1
  f2_mellow: number;      // 0 to 1
  f3_heavy: number;       // 0 to 1
  f4_mild: number;        // 0 to 1
  f5_dry: number;         // 0 to 1
  f6_light: number;       // 0 to 1
}

export type TasteType = 
  | 'floral'     // 華やか系
  | 'mellow'     // まろやか系
  | 'heavy'      // 重厚系
  | 'mild'       // 穏やか系
  | 'dry'        // キレ系
  | 'light'      // 軽快系
  | 'balanced'   // バランス型
  | 'explorer';  // 冒険家型

export interface UserTastePreference {
  id: string;
  userId: string;
  vector: PreferenceVector;
  tasteType: TasteType;
  diversityScore: number;
  adventureScore: number;
  totalFavorites: number;
  calculatedAt: Date;
  updatedAt: Date;
}

export interface Recommendation {
  id: string;
  userId: string;
  sakeId: string;
  similarityScore: number;
  predictedRating: number;
  recommendationType: 'similar' | 'explore';
  recommendationReason: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface RecommendOptions {
  count: number;
  mood?: 'usual' | 'adventure' | 'discovery' | 'special';
  includeSimilar?: boolean;
  includeExplore?: boolean;
}

export interface PreferenceAnalysisOptions {
  timeDecayDays?: number;  // 時間減衰の日数（デフォルト30日）
  minFavorites?: number;   // 分析に必要な最小お気に入り数
  maxFavorites?: number;   // 分析に使用する最大お気に入り数
}
