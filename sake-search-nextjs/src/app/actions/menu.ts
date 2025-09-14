"use server";

import { SakeServiceV2 } from '@/services/SakeServiceV2';
import { SakenowaSakeRepository } from '@/repositories/sakes/SakenowaSakeRepository';
import type { SakeData } from '@/types/sake';
import { MenuService } from '@/services/MenuService';

/**
 * メニューの日本酒名リストを検索し、見つかったSakeDataと見つからなかった文字列に分けて返す
 */
export async function addMenuItemsAction(items: string[]): Promise<{
  foundSakes: SakeData[];
  notFound: string[];
}> {
  const menuService = new MenuService();
  const sakeService = new SakeServiceV2(new SakenowaSakeRepository());

  const normalized = menuService.normalizeItems(items);

  const results = await Promise.all(
    normalized.map(async (item) => {
      try {
        const res = await sakeService.searchSakes({ query: item, limit: 1, offset: 0 });
        return { item, sake: res.sakes[0] ?? null };
      } catch {
        return { item, sake: null };
      }
    })
  );

  const foundSakes: SakeData[] = [];
  const notFound: string[] = [];

  for (const r of results) {
    if (r.sake) foundSakes.push(r.sake);
    else notFound.push(r.item);
  }

  return { foundSakes, notFound };
}
