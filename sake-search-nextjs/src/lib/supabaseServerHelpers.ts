import { cookies } from 'next/headers';
import { createServerActionClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export async function getServerComponentClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
}

export async function getServerActionClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  return createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
}
