"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth/auth-provider";
import { DEAL_STAGE_LABELS, DEAL_STAGE_COLORS } from "@/lib/constants";
import type { Deal } from "@/types/deal";
import { ArrowLeft, Copy, Download, Upload, FileText, Loader2, Share2 } from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

/** ヘッダーに表示する共有ユーザー情報 */
export interface SharedUserInfo {
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

// アバター背景色
const AVATAR_COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];
function getColor(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = ((h << 5) - h + email.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

interface DealHeaderProps {
  deal: Deal;
  isOwner: boolean;
  onImportClick: () => void;
  onCsvExportClick: () => void;
  onYamlExportClick: () => void;
  onPdfExportClick: () => void;
  onShareClick: () => void;
  onDuplicateClick?: () => void;
  isPdfExporting: boolean;
  sharedUsers?: SharedUserInfo[];
  /** 現在オンラインのユーザー（Presence） */
  onlineUsers?: { userId: string; email: string; fullName: string; avatarUrl: string | null }[];
}

export function DealHeader({
  deal,
  isOwner,
  onImportClick,
  onCsvExportClick,
  onYamlExportClick,
  onPdfExportClick,
  onShareClick,
  onDuplicateClick,
  isPdfExporting,
  sharedUsers = [],
  onlineUsers = [],
}: DealHeaderProps) {
  const { user: currentUser } = useAuth();
  // オンラインユーザーのメールSet（自分を含む）
  const currentEmail = currentUser?.email ?? "";
  const onlineEmails = new Set([...onlineUsers.map((u) => u.email), currentEmail]);

  // sharedUsers + オンラインユーザー + 自分自身を統合したアバターリスト
  const knownEmails = new Set(sharedUsers.map((u) => u.email.toLowerCase()));
  // オンラインだが sharedUsers にいないユーザー（他のオーナー等）
  const extraOnline: SharedUserInfo[] = onlineUsers
    .filter((u) => !knownEmails.has(u.email.toLowerCase()) && u.email !== currentEmail)
    .map((u) => ({ email: u.email, fullName: u.fullName, avatarUrl: u.avatarUrl, role: "owner" }));
  // 自分自身（常に先頭に表示、sharedUsers に含まれていない場合のみ）
  const selfInList = knownEmails.has(currentEmail.toLowerCase());
  const selfEntry: SharedUserInfo[] = selfInList ? [] : [{
    email: currentEmail,
    fullName: (currentUser?.user_metadata?.full_name as string) ?? currentEmail,
    avatarUrl: (currentUser?.user_metadata?.avatar_url as string) ?? null,
    role: isOwner ? "owner" : (deal.shareRole ?? "viewer"),
  }];
  const allAvatarUsers = [...selfEntry, ...extraOnline, ...sharedUsers];

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{deal.name}</h1>
            <Badge
              variant="secondary"
              className={DEAL_STAGE_COLORS[deal.stage]}
            >
              {DEAL_STAGE_LABELS[deal.stage]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{deal.clientName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {deal.shareRole && (
          <Badge variant="outline" className="text-xs">
            {deal.shareRole === "editor" ? "編集可" : "閲覧のみ"}
          </Badge>
        )}
        {/* 共有ユーザー + オンラインユーザーのアバター重ね（Google Docs風） */}
        {allAvatarUsers.length > 0 && (
          <div className="flex items-center -space-x-2 mr-1">
            {allAvatarUsers.slice(0, 4).map((u) => {
              const isOnline = onlineEmails.has(u.email);
              return (
                <Tooltip key={u.email}>
                  <TooltipTrigger asChild>
                    <div className={`relative transition-opacity ${isOnline ? "" : "opacity-40 grayscale"}`}>
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt={u.fullName || u.email}
                          className="h-7 w-7 rounded-full border-2 border-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-medium text-white ${getColor(u.email)}`}>
                          {(u.fullName || u.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">{u.fullName || u.email}</p>
                    <p className="text-muted-foreground">
                      {u.role === "owner" ? "オーナー" : u.role === "editor" ? "編集可" : "閲覧のみ"}
                      {isOnline ? " · オンライン" : ""}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            {allAvatarUsers.length > 4 && (
              <div className="h-7 w-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                +{allAvatarUsers.length - 4}
              </div>
            )}
          </div>
        )}
        {(isOwner || deal.shareRole === "editor") && (
          <Button variant="outline" size="sm" onClick={onShareClick}>
            <Share2 className="h-4 w-4 mr-1" />
            共有
          </Button>
        )}
        {isOwner && (
          <Button variant="outline" size="sm" onClick={onImportClick}>
            <Upload className="h-4 w-4 mr-1" />
            インポート
          </Button>
        )}
        {deal.shareRole && onDuplicateClick && (
          <Button variant="outline" size="sm" onClick={onDuplicateClick}>
            <Copy className="h-4 w-4 mr-1" />
            この組織図をコピー
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              エクスポート
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCsvExportClick}>
              CSVエクスポート
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onYamlExportClick}>
              YAMLエクスポート
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPdfExportClick} disabled={isPdfExporting}>
              {isPdfExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              PDF出力（組織図）
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
