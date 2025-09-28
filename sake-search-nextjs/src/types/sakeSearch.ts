import type { SakeData } from '@/types/sake';

export interface SakeSearchFilters {
  prefecture?: string;
  type?: string;
  sweetness?: {
    min?: number;
    max?: number;
  };
  richness?: {
    min?: number;
    max?: number;
  };
  minRating?: number;
  maxPrice?: number;
}

export interface SakeSearchOptions {
  query: string;
  filters?: SakeSearchFilters;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'rating' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface SakeSearchResult {
  sakes: SakeData[];
  total: number;
  query: string;
  filters?: SakeSearchFilters;
  hasMore: boolean;
  timestamp: string;
}

export class SakeSearchError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'SakeSearchError';
  }
}
