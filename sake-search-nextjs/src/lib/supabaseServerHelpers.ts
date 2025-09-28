import { cookies } from 'next/headers';
import { createServerActionClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';

type ComponentClientOptions = Parameters<typeof createServerComponentClient<Database>>[0];
type ActionClientOptions = Parameters<typeof createServerActionClient<Database>>[0];

type ClientConfig = Parameters<typeof createServerActionClient<Database>>[1];

export async function getReadOnlyServerComponentClient() {
  const cookieStore = await cookies();
  const options: ComponentClientOptions = {
    cookies: (() => cookieStore) as unknown as ComponentClientOptions['cookies'],
  };
  const authOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  } as unknown as ClientConfig;
  return createServerComponentClient<Database>(options, authOptions);
}

export async function getServerActionClient() {
  const cookieStore = await cookies();
  const options: ActionClientOptions = {
    cookies: (() => cookieStore) as unknown as ActionClientOptions['cookies'],
  };
  return createServerActionClient<Database>(options);
}
