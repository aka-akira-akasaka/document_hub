"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceUser {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Supabase Realtime Presence で案件を今見ているユーザーを追跡するフック。
 * マウント時に join、アンマウント時に leave。
 */
export function useRealtimePresence(dealId: string) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user || !dealId) return;

    const supabase = createClient();
    const channel = supabase.channel(`deal-presence:${dealId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];
        for (const [, presences] of Object.entries(state)) {
          for (const p of presences) {
            // 自分以外のユーザーのみ
            if (p.userId !== user.id) {
              users.push({
                userId: p.userId,
                email: p.email,
                fullName: p.fullName,
                avatarUrl: p.avatarUrl,
              });
            }
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: user.id,
            email: user.email ?? "",
            fullName: (user.user_metadata?.full_name as string) ?? "",
            avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [dealId, user]);

  return { onlineUsers, channel: channelRef };
}
