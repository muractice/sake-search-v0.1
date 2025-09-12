import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '@/features/auth/contexts/AuthContext';

// Mock supabase client exported from lib
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
  },
}));

import { supabase } from '@/lib/supabase';
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  let authCallback: ((event: string, session: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    authCallback = null;

    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } } as any);
    mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: null } } as any);
    mockSupabase.auth.onAuthStateChange.mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } } as any;
    });
  });

  it('provides null user initially and updates loading state', async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSupabase.auth.getSession).toHaveBeenCalled();
  });

  it('loads user from initial session', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com' } as any;
    mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: mockUser } } } as any);

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.user?.id).toBe('u1');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('updates user on auth state change', async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      authCallback?.('SIGNED_IN', { user: { id: 'u2' } } as any);
    });
    expect(result.current.user?.id).toBe('u2');
  });

  it('signInWithEmail delegates to supabase', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null } as any);
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await act(async () => {
      await result.current.signInWithEmail('a@b.com', 'secret');
    });
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
  });

  it('signUpWithEmail delegates to supabase', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null } as any);
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await act(async () => {
      await result.current.signUpWithEmail('a@b.com', 'secret');
    });
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
  });

  it('signOut delegates to supabase', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null } as any);
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});

