"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDealShareStore } from "@/stores/deal-share-store";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Link2, X } from "lucide-react";
import type { DealShare, ShareRole } from "@/types/deal-share";
import type { Profile } from "@/types/profile";

const EMPTY_SHARES: DealShare[] = [];

// フリードメイン一覧（サジェスト無効化対象）
const FREE_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.jp",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "protonmail.com", "proton.me",
  "zoho.com", "mail.com", "gmx.com",
]);

// アバター背景色（メールハッシュから決定）
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
];

function getAvatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name: string, email: string): string {
  if (name) return name.charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

/** ユーザーアバター */
function UserAvatar({
  avatarUrl,
  name,
  email,
  size = "md",
}: {
  avatarUrl?: string | null;
  name: string;
  email: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs";
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name || email}
        className={`${sizeClass} rounded-full shrink-0`}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-medium shrink-0 ${getAvatarColor(email)}`}
    >
      {getInitial(name, email)}
    </div>
  );
}

interface DealShareDialogProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealShareDialog({ dealId, open, onOpenChange }: DealShareDialogProps) {
  const { user } = useAuth();
  const shares = useDealShareStore((s) => s.sharesByDeal[dealId] ?? EMPTY_SHARES);
  const addShare = useDealShareStore((s) => s.addShare);
  const updateShare = useDealShareStore((s) => s.updateShare);
  const removeShare = useDealShareStore((s) => s.removeShare);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("viewer");
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ログインユーザーのドメイン
  const userDomain = user?.email?.split("@")[1]?.toLowerCase() ?? "";
  const isFreeDomain = FREE_DOMAINS.has(userDomain);

  // サジェスト検索（300ms デバウンス、同一ドメイン限定）
  const fetchSuggestions = useCallback(
    async (query: string) => {
      // フリードメインの場合はサジェスト無効
      if (!user || isFreeDomain || !userDomain) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      // 最低1文字から検索（同一ドメインなので範囲が限定的）
      if (query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url")
          .ilike("email", `%${query}%`)
          .ilike("email", `%@${userDomain}`)
          .neq("id", user.id)
          .limit(6);

        if (!data || data.length === 0) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        // 既に共有済みのユーザーを除外
        const sharedEmails = new Set(shares.map((s) => s.sharedWithEmail.toLowerCase()));
        const filtered = (data as { id: string; email: string; full_name: string; avatar_url: string | null }[])
          .filter((p) => !sharedEmails.has(p.email.toLowerCase()))
          .map((p) => ({
            id: p.id,
            email: p.email,
            fullName: p.full_name,
            avatarUrl: p.avatar_url,
          }));

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch {
        // profiles テーブル未作成時など
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [user, shares, userDomain, isFreeDomain]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (email.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(email);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email, fetchSuggestions]);

  const handleAdd = (targetEmail?: string) => {
    const trimmed = (targetEmail ?? email).trim().toLowerCase();
    if (!trimmed) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("有効なメールアドレスを入力してください");
      return;
    }
    if (user?.email && trimmed === user.email.toLowerCase()) {
      toast.error("自分自身には共有できません");
      return;
    }
    if (shares.some((s) => s.sharedWithEmail.toLowerCase() === trimmed)) {
      toast.error("このメールアドレスは既に共有されています");
      return;
    }
    if (!user) return;

    addShare({ dealId, ownerId: user.id, email: trimmed, role });
    setEmail("");
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success(`${trimmed} に共有しました`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (profile: Profile) => {
    handleAdd(profile.email);
  };

  const handleRoleChange = (shareId: string, newRole: ShareRole) => {
    updateShare(shareId, dealId, { role: newRole });
    toast.success("権限を変更しました");
  };

  const handleRemove = (shareId: string, shareEmail: string) => {
    removeShare(shareId, dealId);
    toast.success(`${shareEmail} の共有を解除しました`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("リンクをコピーしました");
  };

  // オーナー情報
  const ownerName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const ownerAvatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const ownerEmail = user?.email ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">案件を共有</DialogTitle>
        </DialogHeader>

        {/* メール入力 + 権限 */}
        <div className="px-5 pb-3 relative">
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="メールアドレスを入力..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="flex-1 h-9"
            />
            <Select value={role} onValueChange={(v) => setRole(v as ShareRole)}>
              <SelectTrigger className="w-[100px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">閲覧者</SelectItem>
                <SelectItem value="editor">編集者</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 px-3" onClick={() => handleAdd()}>
              招待
            </Button>
          </div>

          {/* サジェストドロップダウン */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-5 right-5 top-full mt-1 z-50 rounded-lg border bg-white shadow-lg py-1 max-h-52 overflow-y-auto">
              <p className="px-3 py-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                おすすめ
              </p>
              {suggestions.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(profile)}
                >
                  <UserAvatar
                    avatarUrl={profile.avatarUrl}
                    name={profile.fullName}
                    email={profile.email}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    {profile.fullName && (
                      <p className="text-sm font-medium truncate">
                        {profile.fullName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 truncate">
                      {profile.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* アクセスできるユーザー一覧 */}
        <div className="px-5 py-3">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
            アクセスできるユーザー
          </p>

          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {/* オーナー行（固定） */}
            <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
              <UserAvatar
                avatarUrl={ownerAvatarUrl}
                name={ownerName}
                email={ownerEmail}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {ownerName}
                  <span className="text-gray-400 font-normal ml-1">（あなた）</span>
                </p>
                <p className="text-xs text-gray-500 truncate">{ownerEmail}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">オーナー</span>
            </div>

            {/* 共有ユーザー */}
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 group"
              >
                <UserAvatar
                  avatarUrl={null}
                  name=""
                  email={share.sharedWithEmail}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{share.sharedWithEmail}</p>
                  {!share.sharedWithUserId && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      招待中
                    </Badge>
                  )}
                </div>
                <Select
                  value={share.role}
                  onValueChange={(v) => handleRoleChange(share.id, v as ShareRole)}
                >
                  <SelectTrigger className="w-[88px] h-7 text-xs border-0 shadow-none hover:bg-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">閲覧者</SelectItem>
                    <SelectItem value="editor">編集者</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => handleRemove(share.id, share.sharedWithEmail)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* フッター: リンクコピー */}
        <div className="px-5 py-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleCopyLink}
          >
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            リンクをコピー
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
