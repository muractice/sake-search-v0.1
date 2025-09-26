import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, type Database } from '@/lib/supabase';
import type { CreateRecordInput, DrinkingRecord, UpdateRecordInput } from '@/types/record';
import type { RecordSearchOptions, RecordSearchResult, RecordFilters } from '@/services/records/types';
import { IRecordRepository } from './RecordRepository';

// Supabase 型定義に未登録のため、ローカルで厳密化
interface DrinkingRecordRow {
  id: string;
  user_id: string;
  sake_id: string;
  sake_name: string;
  sake_brewery: string | null;
  brewery_id: number | null;
  date: string; // YYYY-MM-DD
  rating: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

interface DrinkingRecordWithAreaRow extends DrinkingRecordRow {
  brewery_name: string | null;
  area_id: number | null;
  area_name: string | null;
}


export class SupabaseRecordRepository implements IRecordRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.client = (client as SupabaseClient<Database>) ?? (supabase as SupabaseClient<Database>);
  }

  async searchForCurrentUser(options: RecordSearchOptions = {}): Promise<RecordSearchResult> {
    const user = await this.requireUser();
    const {
      limit = 50,
      offset = 0,
      sortBy = 'date',
      sortOrder = 'desc',
      filters,
    } = options;

    let query = this.client
      .from('drinking_records_with_area')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    query = this.applyFilters(query, filters);

    const rangeEnd = offset + limit - 1;
    let orderedQuery = query.order(sortBy, { ascending: sortOrder === 'asc' });
    if (sortBy !== 'created_at') {
      orderedQuery = orderedQuery.order('created_at', { ascending: sortOrder === 'asc' });
    }

    const { data, error, count } = await orderedQuery.range(offset, rangeEnd);

    if (error) throw error;

    const rows = (data ?? []) as DrinkingRecordWithAreaRow[];
    const records = rows.map((row) => this.mapRow(row));
    const total = count ?? records.length;
    const hasMore = offset + records.length < total;

    return {
      records,
      total,
      hasMore,
      filters,
      timestamp: new Date().toISOString(),
    } satisfies RecordSearchResult;
  }

  async getById(recordId: string): Promise<DrinkingRecord | null> {
    const user = await this.requireUser();

    const { data, error } = await this.client
      .from('drinking_records_with_area')
      .select('*')
      .eq('id', recordId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return this.mapRow(data as DrinkingRecordWithAreaRow);
  }

  async createForCurrentUser(input: CreateRecordInput): Promise<DrinkingRecord> {
    const user = await this.requireUser();

    const payload = {
      user_id: user.id,
      sake_id: input.sakeId,
      sake_name: input.sakeName,
      sake_brewery: input.sakeBrewery ?? null,
      brewery_id: input.breweryId ?? null,
      date: input.date ?? new Date().toISOString().split('T')[0],
      rating: input.rating,
      memo: input.memo ?? null,
    } satisfies Partial<DrinkingRecordRow> & { user_id: string; sake_id: string; sake_name: string; rating: number; date: string };

    const { data, error } = await this.client
      .from('drinking_records')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    const inserted = data as DrinkingRecordRow;
    const enriched = await this.getById(inserted.id);
    return enriched ?? this.mapRow(inserted);
  }

  async updateForCurrentUser(recordId: string, input: UpdateRecordInput): Promise<DrinkingRecord> {
    const user = await this.requireUser();

    const payload = {
      date: input.date ?? undefined,
      rating: input.rating ?? undefined,
      memo: input.memo ?? undefined,
    } satisfies Partial<DrinkingRecordRow>;

    const { error } = await this.client
      .from('drinking_records')
      .update(payload)
      .eq('id', recordId)
      .eq('user_id', user.id);

    if (error) throw error;

    const record = await this.getById(recordId);
    if (!record) {
      throw Object.assign(new Error('Record not found'), { status: 404 });
    }
    return record;
  }

  async delete(recordId: string): Promise<void> {
    const user = await this.requireUser();

    const { error } = await this.client
      .from('drinking_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  private applyFilters(
    // ビルダー型は公開されていないため、最小限の型安全を保ちつつ any を許容
    query: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    filters?: RecordFilters,
  ) {
    if (!filters) return query;

    const { sakeId, dateFrom, dateTo, ratingMin, ratingMax, prefecture, brewery, hasMemo } = filters;

    if (sakeId) {
      query = query.eq('sake_id', sakeId);
    }
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date', dateTo);
    }
    if (typeof ratingMin === 'number') {
      query = query.gte('rating', ratingMin);
    }
    if (typeof ratingMax === 'number') {
      query = query.lte('rating', ratingMax);
    }
    if (prefecture) {
      query = query.ilike('area_name', `%${prefecture}%`);
    }
    if (brewery) {
      query = query.ilike('sake_brewery', `%${brewery}%`);
    }
    if (typeof hasMemo === 'boolean') {
      if (hasMemo) {
        query = query.not('memo', 'is', null).not('memo', 'eq', '');
      } else {
        query = query.or('memo.is.null,memo.eq.');
      }
    }

    return query;
  }

  private async requireUser() {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data?.user) {
      throw Object.assign(new Error('Authentication required'), { status: 401 });
    }
    return data.user;
  }

  private mapRow(row: DrinkingRecordWithAreaRow | DrinkingRecordRow): DrinkingRecord {
    return {
      id: row.id,
      userId: row.user_id,
      sakeId: row.sake_id,
      sakeName: row.sake_name,
      sakeBrewery: row.sake_brewery ?? ('brewery_name' in row ? row.brewery_name ?? undefined : undefined),
      sakePrefecture: 'area_name' in row ? row.area_name ?? undefined : undefined,
      sakeAreaId: 'area_id' in row ? row.area_id ?? undefined : undefined,
      date: row.date,
      rating: row.rating,
      memo: row.memo ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
