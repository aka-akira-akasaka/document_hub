"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  const handleUser = useCallback(async (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      await initSupabaseSync(newUser.id);
    } else {
      teardownSupabaseSync();
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

    return () => subscription.unsubscribe();
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
