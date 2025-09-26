import type { DrinkingRecord } from '@/types/record';

export interface RecordFilters {
  sakeId?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  ratingMin?: number;
  ratingMax?: number;
  prefecture?: string;
  brewery?: string;
  hasMemo?: boolean;
}

export type RecordSortKey = 'date' | 'rating' | 'created_at' | 'sake_name';

export interface RecordSearchOptions {
  filters?: RecordFilters;
  limit?: number;
  offset?: number;
  sortBy?: RecordSortKey;
  sortOrder?: 'asc' | 'desc';
}

export interface RecordSearchResult {
  records: DrinkingRecord[];
  total: number;
  hasMore: boolean;
  filters?: RecordFilters;
  timestamp: string;
}

export interface RecordStatistics {
  totalRecords: number;
  uniqueSakes: number;
  averageRating: number;
  mostRatedPrefecture?: string;
  recentActivity: {
    thisWeek: number;
    thisMonth: number;
  };
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}
