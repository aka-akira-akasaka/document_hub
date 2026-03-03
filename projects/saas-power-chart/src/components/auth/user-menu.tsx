"use client";

import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "ユーザー";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="border-t px-3 py-3">
      <div className="flex items-center gap-2.5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-7 w-7 rounded-full shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0">
            {displayName.charAt(0)}
          </div>
        )}
        <span className="text-sm text-gray-700 truncate flex-1">
          {displayName}
        </span>
        <button
          onClick={handleSignOut}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="ログアウト"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
