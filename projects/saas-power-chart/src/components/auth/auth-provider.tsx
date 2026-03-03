"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { initSupabaseSync, teardownSupabaseSync } from "@/lib/supabase-sync";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // auth null フリッカーガード: トークンリフレッシュ時の一時的な null を無視
  const teardownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUser = useCallback(async (newUser: User | null) => {
    // null → ユーザーあり: teardown タイマーをキャンセル（フリッカーだった）
    if (newUser && teardownTimerRef.current) {
      clearTimeout(teardownTimerRef.current);
      teardownTimerRef.current = null;
    }

    setUser(newUser);
    if (newUser) {
      await initSupabaseSync(newUser.id);
    } else {
      // 即座に teardown せず、少し待つ（トークンリフレッシュ時の一時的 null 対策）
      teardownTimerRef.current = setTimeout(() => {
        teardownTimerRef.current = null;
        teardownSupabaseSync();
      }, 2000);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // 初回セッション取得
    supabase.auth.getUser().then(({ data: { user: initialUser } }) => {
      handleUser(initialUser);
    });

    // 認証状態の変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      if (teardownTimerRef.current) {
        clearTimeout(teardownTimerRef.current);
      }
    };
  }, [handleUser]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
