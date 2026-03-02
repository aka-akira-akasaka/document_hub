"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { UserPlus, HelpCircle, Users, ChevronRight } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { getInsertableLevels } from "@/lib/constants";
import type { Stakeholder } from "@/types/stakeholder";

interface AddNodeMenuProps {
  dealId: string;
  onCreateNew: (parentId: string | null, isUnknown?: boolean, suggestedOrgLevel?: number) => void;
  onSelectExisting: (stakeholderId: string) => void;
}

export function AddNodeMenu({ dealId, onCreateNew, onSelectExisting }: AddNodeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const addContext = useUiStore((s) => s.addContext);
  const position = useUiStore((s) => s.addPopoverPosition);
  const closeAddPopover = useUiStore((s) => s.closeAddPopover);

  const stakeholders = useStakeholderStore(
    (s) => s.stakeholdersByDeal[dealId] ?? []
  );
  const dealOrgLevels = useStakeholderStore(
    (s) => s.orgLevelConfigByDeal[dealId]
  );

  // 未接続（parentIdがなく、誰の親でもない孤立ノード）の人物を取得
  const unconnectedPeople = stakeholders.filter((s) => {
    if (!addContext) return false;
    const hasParent = !!s.parentId;
    const isParentOfSomeone = stakeholders.some((c) => c.parentId === s.id);
    // 自分自身は除外
    if (addContext.type === "node" && s.id === addContext.nodeId) return false;
    if (addContext.type === "edge") {
      if (s.id === addContext.sourceId || s.id === addContext.targetId) return false;
    }
    return !hasParent && !isParentOfSomeone;
  });

  // エッジ中間追加時: 上下のorgLevelから挿入可能な役職を推定
  const insertableLevels = useMemo(() => {
    if (!addContext || addContext.type !== "edge") return [];
    const source = stakeholders.find((s) => s.id === addContext.sourceId);
    const target = stakeholders.find((s) => s.id === addContext.targetId);
    return getInsertableLevels(source?.orgLevel, target?.orgLevel, dealOrgLevels);
  }, [addContext, stakeholders, dealOrgLevels]);

  // ノード上（上司追加）の場合: 現在のノードとその親の間の役職を推定
  const insertableLevelsForAbove = useMemo(() => {
    if (!addContext || addContext.type !== "node" || addContext.position !== "above") return [];
    const currentNode = stakeholders.find((s) => s.id === addContext.nodeId);
    if (!currentNode?.parentId) return [];
    const parentNode = stakeholders.find((s) => s.id === currentNode.parentId);
    return getInsertableLevels(parentNode?.orgLevel, currentNode?.orgLevel, dealOrgLevels);
  }, [addContext, stakeholders, dealOrgLevels]);

  const allInsertableLevels = addContext?.type === "edge" ? insertableLevels : insertableLevelsForAbove;

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeAddPopover();
      }
    };
    if (addContext) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [addContext, closeAddPopover]);

  const handleCreateNew = useCallback(() => {
    if (!addContext) return;
    let parentId: string | null = null;
    if (addContext.type === "node") {
      parentId = addContext.position === "below" ? addContext.nodeId : null;
    } else if (addContext.type === "edge") {
      parentId = addContext.sourceId;
    }
    onCreateNew(parentId);
    closeAddPopover();
  }, [addContext, onCreateNew, closeAddPopover]);

  const handleCreateUnknown = useCallback(() => {
    if (!addContext) return;
    let parentId: string | null = null;
    if (addContext.type === "node") {
      parentId = addContext.position === "below" ? addContext.nodeId : null;
    } else if (addContext.type === "edge") {
      parentId = addContext.sourceId;
    }
    onCreateNew(parentId, true);
    closeAddPopover();
  }, [addContext, onCreateNew, closeAddPopover]);

  const handleSelectExisting = useCallback(
    (s: Stakeholder) => {
      onSelectExisting(s.id);
      closeAddPopover();
    },
    [onSelectExisting, closeAddPopover]
  );

  if (!addContext || !position) return null;

  const contextLabel =
    addContext.type === "node"
      ? addContext.position === "below"
        ? "部下を追加"
        : "上司を追加"
      : "中間者を追加";

  // 推定される役職が1つだけの場合はラベルを特定
  const singleSuggestedLevel = allInsertableLevels.length === 1 ? allInsertableLevels[0] : null;
  const hasSuggestion = allInsertableLevels.length > 0;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[220px] animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b mb-1">
        {contextLabel}
        {singleSuggestedLevel && (
          <span className="ml-1 text-blue-600">
            → {singleSuggestedLevel.label}
          </span>
        )}
      </div>

      {/* 役職が推定できる場合: 推定役職での追加ボタンを優先表示 */}
      {hasSuggestion && (
        <>
          {allInsertableLevels.map((level) => (
            <button
              key={level.level}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-left"
              onClick={() => {
                if (!addContext) return;
                let parentId: string | null = null;
                if (addContext.type === "node") {
                  parentId = addContext.position === "below" ? addContext.nodeId : null;
                } else if (addContext.type === "edge") {
                  parentId = addContext.sourceId;
                }
                onCreateNew(parentId, false, level.level);
                closeAddPopover();
              }}
            >
              <ChevronRight className="w-4 h-4 text-blue-600" />
              <span>
                <span className="font-medium text-blue-700">{level.label}</span>
                <span className="text-muted-foreground ml-1">を追加</span>
              </span>
            </button>
          ))}
          <div className="border-t my-1" />
        </>
      )}

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-left"
        onClick={handleCreateNew}
      >
        <UserPlus className="w-4 h-4 text-blue-600" />
        <span>新規作成</span>
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-orange-50 transition-colors text-left"
        onClick={handleCreateUnknown}
      >
        <HelpCircle className="w-4 h-4 text-orange-500" />
        <span>不明人物として追加</span>
      </button>

      {unconnectedPeople.length > 0 && (
        <>
          <div className="border-t my-1" />
          <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
            未接続の人物を選択
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {unconnectedPeople.map((s) => (
              <button
                key={s.id}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors text-left"
                onClick={() => handleSelectExisting(s)}
              >
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <div className="min-w-0">
                  <span className="truncate block">{s.name}</span>
                  {s.title && (
                    <span className="text-xs text-muted-foreground truncate block">
                      {s.title}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
