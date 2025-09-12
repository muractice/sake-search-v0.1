import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/features/auth/contexts/AuthContext';
import { useFavorites } from '@/features/favorites/hooks/useFavorites';
import { SakeData } from '@/types/sake';

// Mock supabase client used by both AuthContext and repositories
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const mockUser = { id: 'u1', email: 'test@example.com' } as any;
const sake1: SakeData = {
  id: 's1',
  name: 'Sake 1',
  brewery: 'Brewery',
  brandId: 1,
  breweryId: 1,
  sweetness: 2,
  richness: 3,
  description: 'desc',
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useFavorites with AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Auth mocks
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } } } as any);
    mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: { user: mockUser } } } as any);
    mockSupabase.auth.onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }) as any);

    // Table handlers
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'favorites') {
        const secondEq = jest.fn().mockResolvedValue({ error: null });
        const firstEq = jest.fn().mockReturnValue({ eq: secondEq });
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              { user_id: mockUser.id, sake_id: sake1.id, sake_data: sake1, created_at: '2024-01-01' },
            ],
            error: null,
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: jest.fn().mockReturnValue({ eq: firstEq }),
        } as any;
      }
      if (table === 'user_preferences') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_id: mockUser.id, show_favorites: false, updated_at: '2024-01-02' },
            error: null,
          }),
          upsert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({
            data: { user_id: mockUser.id, show_favorites: true, updated_at: '2024-01-03' },
            error: null,
          }) }) }),
        } as any;
      }
      if (table === 'recommendation_cache') {
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      return {} as any;
    });
  });

  it('loads favorites and preferences after auth session', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user?.id).toBe('u1');
    expect(result.current.favorites.length).toBe(1);
    expect(result.current.favorites[0].id).toBe('s1');
    // from preferences mock
    expect(result.current.showFavorites).toBe(false);
  });

  it('adds and removes favorites when logged in', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // add (optimistic update adds to head; already one item exists but isFavorite guards duplicate)
    const newSake: SakeData = { ...sake1, id: 's2', name: 'Sake 2' };
    await act(async () => {
      await result.current.addFavorite(newSake);
    });
    expect(result.current.favorites.find(s => s.id === 's2')).toBeTruthy();

    // remove
    await act(async () => {
      await result.current.removeFavorite('s2');
    });
    expect(result.current.favorites.find(s => s.id === 's2')).toBeFalsy();
  });

  it('toggles showFavorites and persists via repository', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const prev = result.current.showFavorites;
    await act(async () => {
      await result.current.toggleShowFavorites();
    });
    expect(result.current.showFavorites).toBe(!prev);
  });
});
