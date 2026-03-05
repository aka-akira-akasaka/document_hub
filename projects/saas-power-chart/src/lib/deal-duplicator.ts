/**
 * 案件コピー（複製）ロジック
 *
 * 共有案件を自分の案件としてコピーする際に使用。
 * 案件・ステークホルダー・関係線・部署グループ・階層設定・部署種別設定を
 * すべて新規IDで複製する。
 */

import { useDealStore } from "@/stores/deal-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { flushPendingSync } from "@/lib/supabase-sync";

export async function duplicateDeal(sourceDealId: string): Promise<string> {
  const dealStore = useDealStore.getState();
  const shStore = useStakeholderStore.getState();
  const groupStore = useOrgGroupStore.getState();

  // --- 1. コピー元データ取得 ---
  const sourceDeal = dealStore.deals.find((d) => d.id === sourceDealId);
  if (!sourceDeal) throw new Error("コピー元の案件が見つかりません");

  const sourceStakeholders = shStore.stakeholdersByDeal[sourceDealId] ?? [];
  const sourceRelationships = shStore.relationshipsByDeal[sourceDealId] ?? [];
  const sourceGroups = groupStore.groupsByDeal[sourceDealId] ?? [];
  const sourceOrgLevels = shStore.orgLevelConfigByDeal[sourceDealId];
  const sourceTierConfig = groupStore.tierConfigByDeal[sourceDealId];

  // --- 2. 新規案件作成 ---
  const newDeal = dealStore.addDeal({
    name: `${sourceDeal.name} (コピー)`,
    clientName: sourceDeal.clientName,
    stage: sourceDeal.stage,
    description: sourceDeal.description,
    targetAmount: sourceDeal.targetAmount,
    expectedCloseDate: sourceDeal.expectedCloseDate,
  });

  // --- 3. グループコピー（親子関係を保持） ---
  const groupIdMap = new Map<string, string>();
  // sortOrder順にソートして親→子の順序を保証
  const sortedGroups = [...sourceGroups].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  for (const g of sortedGroups) {
    const newGroup = groupStore.addGroup({
      dealId: newDeal.id,
      name: g.name,
      parentGroupId: g.parentGroupId
        ? groupIdMap.get(g.parentGroupId) ?? null
        : null,
      color: g.color,
      tier: g.tier,
    });
    groupIdMap.set(g.id, newGroup.id);
  }

  // --- 4. ステークホルダーコピー ---
  const shIdMap = new Map<string, string>();
  for (const s of sourceStakeholders) {
    const newSh = shStore.addStakeholder({
      dealId: newDeal.id,
      name: s.name,
      department: s.department,
      title: s.title,
      roleInDeal: s.roleInDeal,
      influenceLevel: s.influenceLevel,
      attitude: s.attitude,
      mission: s.mission,
      relationshipOwner: s.relationshipOwner,
      parentId: null, // 後で置換
      email: s.email,
      phone: s.phone,
      notes: s.notes,
      orgLevel: s.orgLevel,
      groupId: s.groupId ? groupIdMap.get(s.groupId) ?? null : null,
      position: s.position ? { ...s.position } : undefined,
    });
    shIdMap.set(s.id, newSh.id);
  }

  // parentId を新IDに置換
  for (const s of sourceStakeholders) {
    if (s.parentId) {
      const newParentId = shIdMap.get(s.parentId);
      const newShId = shIdMap.get(s.id);
      if (newParentId && newShId) {
        shStore.updateStakeholder(newShId, newDeal.id, {
          parentId: newParentId,
        });
      }
    }
  }

  // --- 5. 関係線コピー ---
  for (const r of sourceRelationships) {
    // sourceId/targetId をマッピング（stakeholder or group）
    const newSourceId =
      r.sourceType === "group"
        ? groupIdMap.get(r.sourceId)
        : shIdMap.get(r.sourceId);
    const newTargetId =
      r.targetType === "group"
        ? groupIdMap.get(r.targetId)
        : shIdMap.get(r.targetId);

    if (newSourceId && newTargetId) {
      shStore.addRelationship({
        dealId: newDeal.id,
        sourceId: newSourceId,
        targetId: newTargetId,
        type: r.type,
        label: r.label,
        bidirectional: r.bidirectional,
        direction: r.direction,
        color: r.color,
        targetType: r.targetType,
        sourceType: r.sourceType,
        sourceHandle: r.sourceHandle,
        targetHandle: r.targetHandle,
      });
    }
  }

  // --- 6. 階層設定コピー ---
  if (sourceOrgLevels && sourceOrgLevels.length > 0) {
    shStore.setOrgLevels(newDeal.id, [...sourceOrgLevels]);
  }

  // --- 7. 部署種別設定コピー ---
  if (sourceTierConfig && sourceTierConfig.length > 0) {
    groupStore.setTierConfig(newDeal.id, [...sourceTierConfig]);
  }

  // --- 8. Supabase同期 ---
  await flushPendingSync();

  return newDeal.id;
}
