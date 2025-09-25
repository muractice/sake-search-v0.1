import { cookies } from 'next/headers';
import { createServerActionClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

type CookieStore = ReturnType<typeof cookies>;

async function resolveCookies(): Promise<CookieStore> {
  return cookies();
}

export async function getServerComponentClient() {
  const cookieStore = await resolveCookies();
  return createServerComponentClient<Database>({
    cookies: () => Promise.resolve(cookieStore),
  }) as SupabaseClient<Database>;
}

export async function getServerActionClient() {
  const cookieStore = await resolveCookies();
  return createServerActionClient<Database>({
    cookies: () => Promise.resolve(cookieStore),
  }) as SupabaseClient<Database>;
}
