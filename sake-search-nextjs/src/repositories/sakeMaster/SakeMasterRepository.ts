import type { Database } from '@/lib/supabase';

export type SakeMasterRecord = Database['public']['Tables']['sake_master']['Row'];

export interface ISakeMasterRepository {
  listAll(): Promise<SakeMasterRecord[]>;
}
