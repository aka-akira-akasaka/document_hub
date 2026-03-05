"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastUpdate: number;
}

const CURSOR_COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
  "#ec4899", "#14b8a6", "#6366f1", "#f43f5e",
];

function getCursorColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = ((h << 5) - h + userId.charCodeAt(i)) | 0;
  }
  return CURSOR_COLORS[Math.abs(h) % CURSOR_COLORS.length];
}

const THROTTLE_MS = 100;
const CURSOR_TIMEOUT_MS = 3000;

/**
 * Figma風カーソル共有フック。
 * 自分のカーソル位置を Broadcast 送信し、他ユーザーのカーソルを受信する。
 */
export function useRealtimeCursors(dealId: string) {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSentRef = useRef(0);
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || !dealId) return;

    const supabase = createClient();
    const channel = supabase.channel(`deal-cursors:${dealId}`);

    channel
      .on("broadcast", { event: "cursor-move" }, (payload) => {
        const data = payload.payload as {
          userId: string;
          name: string;
          x: number;
          y: number;
        };
        if (data.userId === user.id) return;

        setCursors((prev) => {
          const next = new Map(prev);
          next.set(data.userId, {
            userId: data.userId,
            name: data.name,
            color: getCursorColor(data.userId),
            x: data.x,
            y: data.y,
            lastUpdate: Date.now(),
          });
          return next;
        });
      })
      .on("broadcast", { event: "cursor-leave" }, (payload) => {
        const { userId } = payload.payload as { userId: string };
        setCursors((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      })
      .subscribe();

    channelRef.current = channel;

    // 3秒間更新がないカーソルを自動削除
    cleanupTimerRef.current = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [id, cursor] of next) {
          if (now - cursor.lastUpdate > CURSOR_TIMEOUT_MS) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      // 離脱を通知
      channel.send({
        type: "broadcast",
        event: "cursor-leave",
        payload: { userId: user.id },
      });
      channel.unsubscribe();
      channelRef.current = null;
      if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);
    };
  }, [dealId, user]);

  // 100ms スロットルでカーソル位置を送信
  const trackCursor = useCallback(
    (x: number, y: number) => {
      if (!channelRef.current || !user) return;
      const now = Date.now();
      if (now - lastSentRef.current < THROTTLE_MS) return;
      lastSentRef.current = now;

      channelRef.current.send({
        type: "broadcast",
        event: "cursor-move",
        payload: {
          userId: user.id,
          name:
            (user.user_metadata?.full_name as string) ??
            user.email ??
            "",
          x,
          y,
        },
      });
    },
    [user]
  );

  return { cursors, trackCursor };
}
