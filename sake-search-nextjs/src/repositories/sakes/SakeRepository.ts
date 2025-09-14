import { SakeData } from '@/types/sake';
import { SakeSearchFilters, SakeSearchOptions, SakeSearchResult } from '@/services/SakeService';

/**
 * Sake系データの取得/永続化を抽象化するRepositoryインターフェース
 * - 実装例: HttpSakeRepository, SupabaseSakeRepository, CachedSakeRepository など
 */
export interface ISakeRepository {
  search(options: SakeSearchOptions): Promise<SakeSearchResult>;
  getById(id: string): Promise<SakeData | null>;
  getTrending(limit?: number): Promise<SakeData[]>;
  getSuggestions(query: string, limit?: number): Promise<string[]>;
}

// 型再利用のためのエクスポート（ServiceV2 でも利用）
export type { SakeSearchFilters, SakeSearchOptions, SakeSearchResult };

