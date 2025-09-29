import { SakeData } from '@/types/sake';
import {
  SakeSearchFilters,
  SakeSearchOptions,
  SakeSearchResult,
} from '@/types/sakeSearch';

/**
 * Sake系データの取得/永続化を抽象化するRepositoryインターフェース
 * - 実装例: HttpSakeRepository, SupabaseSakeRepository, CachedSakeRepository など
 */
export interface ISakeRepository {
  search(options: SakeSearchOptions): Promise<SakeSearchResult>;
  getTrending(limit?: number): Promise<SakeData[]>;
}

// 型再利用のためのエクスポート（ServiceV2 でも利用）
export type { SakeSearchFilters, SakeSearchOptions, SakeSearchResult };
export { SakeSearchError } from '@/types/sakeSearch';
