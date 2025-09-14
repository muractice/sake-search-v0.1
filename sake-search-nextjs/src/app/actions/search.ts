"use server";

import { SakeServiceV2 } from '@/services/SakeServiceV2';
import { SakenowaSakeRepository } from '@/repositories/sakes/SakenowaSakeRepository';
import { SakeSearchOptions, SakeSearchResult } from '@/repositories/sakes/SakeRepository';

/**
 * 検索 Server Action（Webの既定導線）
 * - 将来モバイル共有が必要になったら /api にも同じ契約を公開
 */
export async function searchSakesAction(options: SakeSearchOptions): Promise<SakeSearchResult> {
  const service = new SakeServiceV2(new SakenowaSakeRepository());
  return service.searchSakes(options);
}

