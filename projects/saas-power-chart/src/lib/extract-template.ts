/**
 * 現在の案件データからテンプレートを抽出するユーティリティ
 */

import type { DealTemplate, TemplateGroup, TemplateStakeholder, TemplateTierConfig } from "@/lib/deal-templates";
import type { OrgGroup } from "@/types/org-group";
import type { Stakeholder } from "@/types/stakeholder";
import type { OrgLevelEntry } from "@/stores/stakeholder-store";

/**
 * 案件の現在のグループ・ステークホルダー・orgLevelsからテンプレートを生成
 * IDベースの参照をrefKeyに変換し、個人情報（名前等）をプレースホルダーに置換
 */
export function extractTemplate(
  name: string,
  description: string,
  orgGroups: OrgGroup[],
  stakeholders: Stakeholder[],
  orgLevels: OrgLevelEntry[],
  tierConfig?: TemplateTierConfig[]
): DealTemplate {
  // グループID → refKeyマッピング
  const groupRefMap = new Map<string, string>();
  orgGroups.forEach((g, i) => {
    groupRefMap.set(g.id, `group-${i}`);
  });

  // ステークホルダーID → refKeyマッピング
  const stakeholderRefMap = new Map<string, string>();
  stakeholders.forEach((s, i) => {
    stakeholderRefMap.set(s.id, `person-${i}`);
  });

  // グループをテンプレート形式に変換
  const templateGroups: TemplateGroup[] = orgGroups.map((g) => ({
    refKey: groupRefMap.get(g.id)!,
    name: g.name,
    parentRefKey: g.parentGroupId ? groupRefMap.get(g.parentGroupId) ?? null : null,
    color: g.color,
    tier: g.tier ?? 0,
  }));

  // ステークホルダーをテンプレート形式に変換（個人名をプレースホルダーに）
  const templateStakeholders: TemplateStakeholder[] = stakeholders.map((s) => ({
    refKey: stakeholderRefMap.get(s.id)!,
    name: `（${s.title || s.department}）`,
    title: s.title,
    department: s.department,
    roleInDeal: s.roleInDeal,
    influenceLevel: s.influenceLevel,
    attitude: s.attitude,
    orgLevel: s.orgLevel,
    groupRefKey: s.groupId ? groupRefMap.get(s.groupId) ?? null : null,
    parentRefKey: s.parentId ? stakeholderRefMap.get(s.parentId) ?? null : null,
  }));

  return {
    id: "", // カスタムテンプレートストアで上書きされる
    name,
    description,
    groupCount: templateGroups.length,
    stakeholderCount: templateStakeholders.length,
    orgLevels: [...orgLevels],
    tierConfig: tierConfig && tierConfig.length > 0 ? [...tierConfig] : undefined,
    groups: templateGroups,
    stakeholders: templateStakeholders,
  };
}
