/**
 * テンプレート適用ロジック
 *
 * DealTemplate の定義をもとに OrgGroup + Stakeholder を一括生成する。
 * React コンポーネント外から呼ぶため useXxxStore.getState() でストアにアクセスする。
 */

import type { DealTemplate } from "@/lib/deal-templates";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useHistoryStore } from "@/stores/history-store";
import { toast } from "sonner";

export function applyTemplate(dealId: string, template: DealTemplate): void {
  // 空テンプレートは何も生成しない
  if (template.groups.length === 0 && template.stakeholders.length === 0) return;

  // Undo 用スナップショット（1回で全テンプレート適用を一括巻き戻し）
  useHistoryStore.getState().captureSnapshot();

  const { addGroup } = useOrgGroupStore.getState();
  const { addStakeholder } = useStakeholderStore.getState();

  // refKey → 実際の UUID マッピング
  const groupIdMap = new Map<string, string>();
  const stakeholderIdMap = new Map<string, string>();

  // --- グループ作成（親→子の順序で処理） ---
  // parentRefKey が null のものを先に、子は親が作成された後に処理
  const pending = [...template.groups];
  const maxIterations = pending.length * 2; // 無限ループ防止
  let iterations = 0;

  while (pending.length > 0 && iterations < maxIterations) {
    iterations++;
    const item = pending.shift()!;

    // 親がまだ作成されていない場合は後回し
    if (item.parentRefKey && !groupIdMap.has(item.parentRefKey)) {
      pending.push(item);
      continue;
    }

    const created = addGroup({
      dealId,
      name: item.name,
      parentGroupId: item.parentRefKey ? groupIdMap.get(item.parentRefKey) ?? null : null,
      color: item.color,
    });

    groupIdMap.set(item.refKey, created.id);
  }

  // --- ステークホルダー作成（上司→部下の順序で処理） ---
  const pendingStakeholders = [...template.stakeholders];
  const maxSIterations = pendingStakeholders.length * 2;
  let sIterations = 0;

  while (pendingStakeholders.length > 0 && sIterations < maxSIterations) {
    sIterations++;
    const item = pendingStakeholders.shift()!;

    // 上司がまだ作成されていない場合は後回し
    if (item.parentRefKey && !stakeholderIdMap.has(item.parentRefKey)) {
      pendingStakeholders.push(item);
      continue;
    }

    const created = addStakeholder({
      dealId,
      name: item.name,
      title: item.title,
      department: item.department,
      roleInDeal: item.roleInDeal,
      influenceLevel: item.influenceLevel,
      attitude: item.attitude,
      orgLevel: item.orgLevel,
      groupId: item.groupRefKey ? groupIdMap.get(item.groupRefKey) ?? null : null,
      parentId: item.parentRefKey ? stakeholderIdMap.get(item.parentRefKey) ?? null : null,
      notes: "",
      mission: "",
      relationshipOwner: "",
      email: "",
      phone: "",
    });

    stakeholderIdMap.set(item.refKey, created.id);
  }

  toast.success(`「${template.name}」テンプレートを適用しました`);
}
