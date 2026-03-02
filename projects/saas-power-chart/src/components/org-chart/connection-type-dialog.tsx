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
import { Label } from "@/components/ui/label";
import {
  RELATIONSHIP_TYPE_LABELS,
  isPositiveRelationship,
} from "@/lib/constants";
import type { RelationshipType } from "@/types/relationship";
import { cn } from "@/lib/utils";

/** 選択可能な関係性タイプ（targetTypeに応じてフィルタ） */
const PERSON_TO_PERSON_TYPES: RelationshipType[] = [
  "alliance",
  "rivalry",
  "influence",
  "reporting",
  "informal",
];
const PERSON_TO_GROUP_TYPES: RelationshipType[] = ["oversight"];

interface ConnectionTypeDialogProps {
  open: boolean;
  targetType: "stakeholder" | "group";
  onConfirm: (type: RelationshipType, label: string, bidirectional: boolean) => void;
  onCancel: () => void;
}

export function ConnectionTypeDialog({
  open,
  targetType,
  onConfirm,
  onCancel,
}: ConnectionTypeDialogProps) {
  const typeOptions =
    targetType === "group" ? PERSON_TO_GROUP_TYPES : PERSON_TO_PERSON_TYPES;

  const [selectedType, setSelectedType] = useState<RelationshipType>(typeOptions[0]);
  const [label, setLabel] = useState("");
  const [bidirectional, setBidirectional] = useState(true);

  const handleConfirm = () => {
    onConfirm(selectedType, label.trim(), bidirectional);
    setSelectedType(typeOptions[0]);
    setLabel("");
    setBidirectional(true);
  };

  const handleCancel = () => {
    onCancel();
    setSelectedType(typeOptions[0]);
    setLabel("");
    setBidirectional(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {targetType === "group" ? "管掌関係を作成" : "関係性を作成"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* タイプ選択 */}
          <div className="space-y-2">
            <Label>タイプ</Label>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((t) => {
                const isPositive = isPositiveRelationship(t);
                const isSelected = selectedType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      isSelected
                        ? isPositive
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    )}
                    onClick={() => setSelectedType(t)}
                  >
                    {RELATIONSHIP_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ラベル入力 */}
          <div className="space-y-2">
            <Label htmlFor="conn-label">ラベル（任意）</Label>
            <Input
              id="conn-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: プライベートでも仲が良い"
            />
          </div>

          {/* 双方向フラグ（人→人のみ） */}
          {targetType === "stakeholder" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="conn-bidir"
                checked={bidirectional}
                onChange={(e) => setBidirectional(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="conn-bidir" className="text-sm font-normal">
                双方向
              </Label>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button type="button" onClick={handleConfirm}>
              作成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
