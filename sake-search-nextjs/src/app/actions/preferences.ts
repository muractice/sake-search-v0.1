'use server';

import { cookies } from 'next/headers';
import { UserPreferenceService } from '@/services/preferences/UserPreferenceService';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/SupabaseUserPreferencesRepository';
import type { UserPreferences } from '@/types/preferences';
import { getServerActionClient } from '@/lib/supabaseServerHelpers';

type ServerSupabaseClient = Awaited<ReturnType<typeof getServerActionClient>>;

function createUserPreferenceService(supabase: ServerSupabaseClient) {
  const prefsRepo = new SupabaseUserPreferencesRepository(supabase);
  return new UserPreferenceService(prefsRepo);
}

/**
 * ユーザー設定を取得
 */
export async function getPreferencesAction(userId: string): Promise<UserPreferences | null> {
  await cookies();
  const supabase = getServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }

  const service = createUserPreferenceService(supabase);
  return await service.getPreferences(userId);
}

/**
 * お気に入り表示設定を更新
 */
export async function updateShowFavoritesAction(userId: string, show: boolean): Promise<UserPreferences | null> {
  await cookies();
  const supabase = getServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }

  const service = createUserPreferenceService(supabase);
  return await service.updateShowFavorites(userId, show);
}
