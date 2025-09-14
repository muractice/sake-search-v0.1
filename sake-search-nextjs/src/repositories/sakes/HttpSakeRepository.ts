import { ApiClient, ApiClientError } from '@/services/core/ApiClient';
import { SakeData } from '@/types/sake';
import { ISakeRepository, SakeSearchOptions, SakeSearchResult } from './SakeRepository';

/**
 * HTTP(API) 実装の雛形
 * 既存の `/api/v1/sakes/*` エンドポイントを利用する想定
 * 設計段階のため、現状は未使用のスタブとして配置
 */
export class HttpSakeRepository implements ISakeRepository {
  constructor(private readonly api: ApiClient) {}

  async search(options: SakeSearchOptions): Promise<SakeSearchResult> {
    try {
      const res = await this.api.post<SakeSearchResult>('/api/v1/sakes/search', options);
      return res.data;
    } catch (e) {
      // 互換性のためのフォールバック: 旧 `/api/search?q=...` を使用
      if (e instanceof ApiClientError && (e.statusCode === 404 || e.statusCode === 0)) {
        const resp = await fetch(`/api/search?q=${encodeURIComponent(options.query)}`);
        const legacy = await resp.json() as { success: boolean; results: unknown[] };
        return {
          sakes: (legacy.success ? legacy.results : []) as any,
          total: legacy.success ? legacy.results.length : 0,
          query: options.query,
          filters: options.filters,
          hasMore: false,
          timestamp: new Date().toISOString(),
        };
      }
      throw e;
    }
  }

  async getById(id: string): Promise<SakeData | null> {
    const res = await this.api.get<SakeData>(`/api/v1/sakes/${id}`);
    return res.data;
  }

  async getTrending(limit: number = 10): Promise<SakeData[]> {
    const res = await this.api.get<SakeData[]>('/api/v1/sakes/trending', {
      limit: String(limit),
    });
    return res.data;
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const res = await this.api.get<string[]>('/api/v1/sakes/suggestions', {
      q: query,
      limit: String(limit),
    });
    return res.data;
  }
}
