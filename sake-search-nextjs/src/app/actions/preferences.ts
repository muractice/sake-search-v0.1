'use server';

import { UserPreferenceService } from '@/services/preferences/UserPreferenceService';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/SupabaseUserPreferencesRepository';
import type { UserPreferences } from '@/types/preferences';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import { getServerActionClient } from '@/lib/supabaseServerHelpers';

function createUserPreferenceService(client: SupabaseClient<Database>) {
  const prefsRepo = new SupabaseUserPreferencesRepository(client);
  return new UserPreferenceService(prefsRepo);
}

/**
 * ユーザー設定を取得
 */
export async function getPreferencesAction(userId: string): Promise<UserPreferences | null> {
  const supabase = await getServerActionClient();
  const client = supabase as SupabaseClient<Database>;
  const { data: { user } } = await client.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }

  const service = createUserPreferenceService(client);
  return await service.getPreferences(userId);
}

/**
 * お気に入り表示設定を更新
 */
export async function updateShowFavoritesAction(userId: string, show: boolean): Promise<UserPreferences | null> {
  const supabase = await getServerActionClient();
  const client = supabase as SupabaseClient<Database>;
  const { data: { user } } = await client.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User authentication failed');
  }

  const service = createUserPreferenceService(client);
  return await service.updateShowFavorites(userId, show);
}
