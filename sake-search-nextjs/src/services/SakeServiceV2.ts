import { SakeData } from '@/types/sake';
import { ISakeRepository, SakeSearchOptions, SakeSearchResult } from '@/repositories/sakes/SakeRepository';
import { SakeSearchError } from './SakeService';

/**
 * Repository に依存する新しい Service の骨組み（設計のみ）
 * - 責務: 入力バリデーション/ドメインロジック/エラーマッピング
 * - I/O は ISakeRepository に委譲
 */
export class SakeServiceV2 {
  constructor(private readonly repo: ISakeRepository) {}

  async searchSakes(options: SakeSearchOptions): Promise<SakeSearchResult> {
    this.validateSearchQuery(options.query);
    try {
      const result = await this.repo.search({
        limit: 20,
        offset: 0,
        sortBy: 'relevance',
        ...options,
      });
      return result;
    } catch (error) {
      this.handleSearchError(error);
    }
  }

  async search(query: string): Promise<SakeData | null> {
    this.validateSearchQuery(query);
    try {
      const result = await this.repo.search({ query, limit: 1, offset: 0 });
      return result.sakes[0] ?? null;
    } catch (error) {
      this.handleSearchError(error);
    }
  }

  async getSakeById(id: string): Promise<SakeData | null> {
    if (!id) throw new SakeSearchError('日本酒IDが指定されていません');
    try {
      return await this.repo.getById(id);
    } catch (error) {
      throw new SakeSearchError('日本酒の詳細取得に失敗しました', error);
    }
  }

  async getTrendingSakes(limit: number = 10): Promise<SakeData[]> {
    try {
      return await this.repo.getTrending(limit);
    } catch (error) {
      throw new SakeSearchError('トレンド日本酒の取得に失敗しました', error);
    }
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) return [];
    try {
      return await this.repo.getSuggestions(query, limit);
    } catch {
      return [];
    }
  }

  private validateSearchQuery(query: string): void {
    if (!query || typeof query !== 'string') throw new SakeSearchError('検索クエリが空です');
    if (query.trim().length === 0) throw new SakeSearchError('検索クエリが空です');
    if (query.length > 100) throw new SakeSearchError('検索クエリが長すぎます（100文字以内）');
    const dangerous = [';', '--', '/*', '*/', 'xp_', 'sp_'];
    if (dangerous.some((p) => query.toLowerCase().includes(p))) throw new SakeSearchError('無効な文字が含まれています');
  }

  private handleSearchError(error: unknown): never {
    if (error instanceof SakeSearchError) throw error;
    throw new SakeSearchError('日本酒の検索に失敗しました', error);
  }
}

