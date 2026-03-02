"use client";

import { useEffect, useState } from "react";

/**
 * Zustand persist とSSRのハイドレーション不一致を防止するフック。
 * マウント後に true を返す。SSR時・初回レンダー時は false。
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
