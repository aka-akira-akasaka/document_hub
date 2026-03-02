"use client";

import { useEffect, useRef } from "react";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import type { Stakeholder } from "@/types/stakeholder";

const EMPTY_S: Stakeholder[] = [];

/**
 * ステークホルダーの department 情報から OrgGroup を自動生成するフック。
 *
 * 以下の条件を全て満たす場合にのみ実行:
 * 1. 案件にステークホルダーが存在する
 * 2. 案件に OrgGroup が1つも存在しない
 * 3. department が設定されたステークホルダーが存在する
 *
 * 自動生成後、各ステークホルダーの groupId を対応するグループに紐付ける。
 */
export function useAutoGroupSeed(dealId: string) {
  const seeded = useRef(false);

  const stakeholders = useStakeholderStore(
    (s) => s.stakeholdersByDeal[dealId] ?? EMPTY_S
  );
  const groupCount = useOrgGroupStore(
    (s) => (s.groupsByDeal[dealId] ?? []).length
  );
  const addGroup = useOrgGroupStore((s) => s.addGroup);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);

  useEffect(() => {
    if (seeded.current) return;
    if (stakeholders.length === 0) return;
    if (groupCount > 0) return;

    // department が設定されたステークホルダーを収集
    const withDept = stakeholders.filter((s) => s.department.trim() !== "");
    if (withDept.length === 0) return;

    seeded.current = true;

    // ユニークな部署名を収集（出現順を維持）
    const seen = new Set<string>();
    const uniqueDepts: string[] = [];
    for (const s of withDept) {
      const dept = s.department.trim();
      if (!seen.has(dept)) {
        seen.add(dept);
        uniqueDepts.push(dept);
      }
    }

    // 各部署に対してグループを作成
    const deptToGroupId = new Map<string, string>();
    for (const dept of uniqueDepts) {
      const group = addGroup({
        dealId,
        name: dept,
        parentGroupId: null,
      });
      deptToGroupId.set(dept, group.id);
    }

    // ステークホルダーの groupId を更新
    for (const s of withDept) {
      const groupId = deptToGroupId.get(s.department.trim());
      if (groupId && s.groupId !== groupId) {
        updateStakeholder(s.id, dealId, { groupId });
      }
    }
  }, [stakeholders, groupCount, dealId, addGroup, updateStakeholder]);
}
