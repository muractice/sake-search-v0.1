import { cookies } from 'next/headers';
import { createServerActionClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export function getServerComponentClient(): SupabaseClient<Database> {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
}

export function getServerActionClient(): SupabaseClient<Database> {
  const cookieStore = cookies();
  return createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
}
