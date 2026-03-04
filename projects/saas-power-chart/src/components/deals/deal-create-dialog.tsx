"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDealStore } from "@/stores/deal-store";
import { flushPendingSync } from "@/lib/supabase-sync";
import { DEAL_STAGE_LABELS, DEAL_STAGE_OPTIONS } from "@/lib/constants";
import type { DealStage } from "@/types/deal";
import { Plus, Loader2 } from "lucide-react";

export function DealCreateDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [stage, setStage] = useState<DealStage>("prospecting");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const addDeal = useDealStore((s) => s.addDeal);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim() || isCreating) return;

    flushSync(() => setIsCreating(true));
    try {
      const deal = addDeal({
        name: name.trim(),
        clientName: clientName.trim(),
        stage,
        description: description.trim(),
      });

      // デバウンスされた同期処理を即座に実行してDB永続化を保証
      await flushPendingSync();

      setName("");
      setClientName("");
      setStage("prospecting");
      setDescription("");
      setOpen(false);
      router.push(`/deals/${deal.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新規案件
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規案件を作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">案件名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: バクラク導入提案"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientName">顧客名</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="例: りそな銀行"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">ステージ</Label>
            <Select
              value={stage}
              onValueChange={(v) => setStage(v as DealStage)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {DEAL_STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">概要</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="案件の概要を入力"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreating ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
