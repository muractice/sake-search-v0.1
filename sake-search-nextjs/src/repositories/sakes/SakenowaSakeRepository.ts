import { ISakeRepository, SakeSearchOptions, SakeSearchResult } from './SakeRepository';
import { SakeData } from '@/types/sake';
import { searchRealSakeData } from '@/lib/sakenowaApi';
import { searchMockSakeData, buildMockSakeData } from '@/lib/mockData';

/**
 * Server-only repository: さけのわAPI（またはモック）へ直接アクセス
 */
export class SakenowaSakeRepository implements ISakeRepository {
  async search(options: SakeSearchOptions): Promise<SakeSearchResult> {
    const { query, filters, limit = 20, offset = 0 } = options;

    const useReal = process.env.USE_SAKENOWA_API === 'true';

    // 実API使用時はエラーをそのまま上位へ伝播（モックへフォールバックしない）
    const all: SakeData[] = useReal
      ? await searchRealSakeData(query)
      : searchMockSakeData(query);

    // TODO: filters の適用（将来対応）

    const paged = all.slice(offset, offset + limit);
    const hasMore = offset + paged.length < all.length;

    return {
      sakes: paged,
      total: all.length,
      query,
      filters,
      hasMore,
      timestamp: new Date().toISOString(),
    };
  }

  async getById(_id: string): Promise<SakeData | null> {
    // 現状のユースケースでは未使用。モックからの検索のみ提供。
    const all = buildMockSakeData();
    return all.find((s) => s.id === _id) ?? null;
  }

  async getTrending(limit: number = 10): Promise<SakeData[]> {
    // モックから上位N件を返す（将来、実API対応）
    return buildMockSakeData().slice(0, limit);
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const normalized = (query || '').toLowerCase().trim();
    if (!normalized) return [];

    const names = buildMockSakeData()
      .map((s) => s.name)
      .filter((n) => n.toLowerCase().includes(normalized));

    // 重複排除して上位N件
    return Array.from(new Set(names)).slice(0, limit);
  }
}
import 'server-only';
