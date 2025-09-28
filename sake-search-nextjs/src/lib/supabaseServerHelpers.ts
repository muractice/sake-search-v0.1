import { cookies } from 'next/headers';
import { createServerActionClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';

type ComponentClientOptions = Parameters<typeof createServerComponentClient<Database>>[0];
type ActionClientOptions = Parameters<typeof createServerActionClient<Database>>[0];

export async function getServerComponentClient() {
  const cookieStore = await cookies();
  const options: ComponentClientOptions = {
    cookies: (() => cookieStore) as unknown as ComponentClientOptions['cookies'],
  };
  return createServerComponentClient<Database>(options);
}

export async function getServerActionClient() {
  const cookieStore = await cookies();
  const options: ActionClientOptions = {
    cookies: (() => cookieStore) as unknown as ActionClientOptions['cookies'],
  };
  return createServerActionClient<Database>(options);
}
