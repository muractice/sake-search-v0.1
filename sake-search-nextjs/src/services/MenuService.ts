/**
 * Menu ドメインの純TSヘルパー
 * - 文字列の正規化・重複排除
 * - SakeData の重複排除/マージ
 */
import type { SakeData } from '@/types/sake';

export class MenuService {
  /**
   * メニュー文字列の正規化 + 重複排除
   */
  normalizeItems(items: string[]): string[] {
    const normalized = items
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return Array.from(new Set(normalized));
  }

  /**
   * 既存SakeDataに新規SakeDataを重複なくマージ
   */
  mergeSakes(existing: SakeData[], incoming: SakeData[]): SakeData[] {
    // NOTE: 現時点では未使用（将来、保存時の統合や差分適用で利用予定）
    const map = new Map<string, SakeData>();
    existing.forEach((s) => map.set(s.id, s));
    incoming.forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  }
}
