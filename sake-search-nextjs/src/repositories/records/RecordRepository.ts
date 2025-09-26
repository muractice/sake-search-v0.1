import type { CreateRecordInput, DrinkingRecord, UpdateRecordInput } from '@/types/record';
import type { RecordSearchOptions, RecordSearchResult } from '@/services/records/types';

export interface IRecordRepository {
  searchForCurrentUser(options?: RecordSearchOptions): Promise<RecordSearchResult>;
  getById(recordId: string): Promise<DrinkingRecord | null>;
  createForCurrentUser(input: CreateRecordInput): Promise<DrinkingRecord>;
  updateForCurrentUser(recordId: string, input: UpdateRecordInput): Promise<DrinkingRecord>;
  delete(recordId: string): Promise<void>;
}
