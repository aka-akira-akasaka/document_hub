"use client";

import { useAuth } from "@/components/auth/auth-provider";

/**
 * 認証 + Supabase データ読み込みが完了するまで false を返すフック。
 * 既存コンポーネントの useHydrated() 呼び出しをそのまま利用可能。
 */
export function useHydrated() {
  const { loading } = useAuth();
  return !loading;
}
