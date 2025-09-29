import { supabase, type Database } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ISakeMasterRepository, SakeMasterRecord } from './SakeMasterRepository';

export class SupabaseSakeMasterRepository implements ISakeMasterRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.client = client ?? (supabase as SupabaseClient<Database>);
  }

  async listAll(): Promise<SakeMasterRecord[]> {
    const { data, error } = await this.client
      .from('sake_master')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as SakeMasterRecord[];
  }
}
