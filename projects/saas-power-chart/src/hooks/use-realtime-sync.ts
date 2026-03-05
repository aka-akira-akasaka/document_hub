"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import { initSupabaseSync } from "@/lib/supabase-sync";
import type { RealtimeChannel } from "@supabase/supabase-js";

let broadcastChannel: RealtimeChannel | null = null;

/**
 * 他ユーザーのデータ変更を Broadcast で受信し、re-fetch で反映するフック。
 */
export function useRealtimeSync(dealId: string) {
  const { user } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || !dealId) return;

    const supabase = createClient();
    const channel = supabase.channel(`deal-sync:${dealId}`);

    channel
      .on("broadcast", { event: "data-change" }, (payload) => {
        // 自分が送った変更通知は無視
        if (payload.payload?.senderId === user.id) return;

        // デバウンス: 1秒以内の連続変更を束ねて1回の re-fetch
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null;
          // 全データを再取得してストアを更新
          initSupabaseSync(user.id);
        }, 1000);
      })
      .subscribe();

    broadcastChannel = channel;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      channel.unsubscribe();
      broadcastChannel = null;
    };
  }, [dealId, user]);
}

/**
 * データ変更を Broadcast 送信するヘルパー。
 * supabase-sync.ts の各 sync 関数から呼び出す。
 */
export function broadcastDataChange(dealId: string, table: string, senderId: string) {
  if (!broadcastChannel) return;
  broadcastChannel.send({
    type: "broadcast",
    event: "data-change",
    payload: { dealId, table, senderId },
  });
}
