'use client';

// useSupabaseUser は Supabase の認証状態取得と購読を統合するクライアント専用フック

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface SupabaseUserState {
  user: User | null;
  isLoading: boolean;
  refresh: () => Promise<User | null>;
}

export const useSupabaseUser = (): SupabaseUserState => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase から最新ユーザー情報を取得し、ローディング状態も整合させる
  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setUser(null);
        return null;
      }
      setUser(data.user ?? null);
      return data.user ?? null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // マウント時に一度だけ認証イベントを購読し、セッション変化を反映する
  useEffect(() => {
    fetchUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [fetchUser]);

  return { user, isLoading, refresh: fetchUser };
};
