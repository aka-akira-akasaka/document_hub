"use client";

import { useState } from "react";
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
import { useDealShareStore } from "@/stores/deal-share-store";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";
import type { DealShare, ShareRole } from "@/types/deal-share";

const EMPTY_SHARES: DealShare[] = [];

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

  const handleAdd = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    // メールアドレスの簡易バリデーション
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("有効なメールアドレスを入力してください");
      return;
    }

    // 自分自身への共有を防止
    if (user?.email && trimmed === user.email.toLowerCase()) {
      toast.error("自分自身には共有できません");
      return;
    }

    // 重複チェック
    if (shares.some((s) => s.sharedWithEmail.toLowerCase() === trimmed)) {
      toast.error("このメールアドレスは既に共有されています");
      return;
    }

    if (!user) return;

    addShare({
      dealId,
      ownerId: user.id,
      email: trimmed,
      role,
    });

    setEmail("");
    toast.success(`${trimmed} に共有しました`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRoleChange = (shareId: string, newRole: ShareRole) => {
    updateShare(shareId, dealId, { role: newRole });
    toast.success("権限を変更しました");
  };

  const handleRemove = (shareId: string, email: string) => {
    removeShare(shareId, dealId);
    toast.success(`${email} の共有を解除しました`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>案件を共有</DialogTitle>
        </DialogHeader>

        {/* 共有追加フォーム */}
        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Select value={role} onValueChange={(v) => setRole(v as ShareRole)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">閲覧者</SelectItem>
              <SelectItem value="editor">編集者</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAdd}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>

        {/* 共有中のユーザー一覧 */}
        {shares.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium text-muted-foreground">
              共有中のユーザー ({shares.length})
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{share.sharedWithEmail}</p>
                    {!share.sharedWithUserId && (
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        招待中
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={share.role}
                    onValueChange={(v) => handleRoleChange(share.id, v as ShareRole)}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">閲覧者</SelectItem>
                      <SelectItem value="editor">編集者</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRemove(share.id, share.sharedWithEmail)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {shares.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            まだ誰とも共有していません
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
