import yaml from "js-yaml";
import type { Stakeholder, RoleInDeal, Attitude, InfluenceLevel } from "@/types/stakeholder";
import type { OrgGroup } from "@/types/org-group";
import type { OrgLevelEntry } from "@/stores/stakeholder-store";
import type { TierEntry } from "@/stores/org-group-store";
import type { ParseResult, ParseError } from "./csv-parser";

// ----------------------------
// YAMLツリーノードの型定義
// ----------------------------

export interface YamlOrgNode {
  name: string;
  title?: string;
  department?: string;
  role_in_deal?: string;
  influence_level?: number;
  attitude?: string;
  mission?: string;
  relationship_owner?: string;
  email?: string;
  phone?: string;
  notes?: string;
  org_level?: number;
  group_id?: string;
  /** 新フォーマット: グループ名参照 */
  group?: string;
  children?: YamlOrgNode[];
}

/** インポート時に復元するグループデータ */
export interface ImportGroupData {
  name: string;
  tier: number;
  parentName: string | null;
  color?: string;
}

/** 拡張パース結果（グループ・設定情報を含む） */
export interface ExtendedParseResult extends ParseResult {
  groups: ImportGroupData[];
  tierConfig: { tier: number; label: string }[];
  orgLevels: { level: number; label: string }[];
  /** stakeholderのgroupIdが名前参照の場合の名前→ID解決用マップキー */
  groupNameRefs: Map<string, string>;
}

// ----------------------------
// バリデーション用定数
// ----------------------------

const VALID_ROLES: RoleInDeal[] = [
  "decision_maker",
  "approver",
  "initiator",
  "evaluator",
  "user",
  "gatekeeper",
  "unknown",
];

const VALID_ATTITUDES: Attitude[] = [
  "promoter",
  "supportive",
  "neutral",
  "cautious",
  "opposed",
];

// ----------------------------
// YAML → パース（旧フォーマット: 配列 / 新フォーマット: オブジェクト）
// ----------------------------

export function parseYAML(yamlText: string, dealId: string): ExtendedParseResult {
  const valid: Stakeholder[] = [];
  const errors: ParseError[] = [];
  let totalNodes = 0;
  const groups: ImportGroupData[] = [];
  const tierConfig: { tier: number; label: string }[] = [];
  const orgLevels: { level: number; label: string }[] = [];
  const groupNameRefs = new Map<string, string>();

  try {
    const parsed = yaml.load(yamlText);

    // 新フォーマット: ルートがオブジェクト（stakeholders キーを持つ）
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const doc = parsed as Record<string, unknown>;

      // tier_config
      if (Array.isArray(doc.tier_config)) {
        for (const entry of doc.tier_config) {
          if (typeof entry === "object" && entry !== null) {
            const e = entry as Record<string, unknown>;
            tierConfig.push({
              tier: Number(e.tier ?? 0),
              label: String(e.label ?? ""),
            });
          }
        }
      }

      // org_levels
      if (Array.isArray(doc.org_levels)) {
        for (const entry of doc.org_levels) {
          if (typeof entry === "object" && entry !== null) {
            const e = entry as Record<string, unknown>;
            orgLevels.push({
              level: Number(e.level ?? 0),
              label: String(e.label ?? ""),
            });
          }
        }
      }

      // groups（ツリー → フラット化）
      if (Array.isArray(doc.groups)) {
        const walkGroups = (nodes: unknown[], parentName: string | null) => {
          for (const raw of nodes) {
            if (typeof raw !== "object" || raw === null) continue;
            const g = raw as Record<string, unknown>;
            const name = String(g.name ?? "");
            if (!name) continue;
            groups.push({
              name,
              tier: Number(g.tier ?? 0),
              parentName,
              color: typeof g.color === "string" ? g.color : undefined,
            });
            if (Array.isArray(g.children)) {
              walkGroups(g.children, name);
            }
          }
        };
        walkGroups(doc.groups, null);
      }

      // stakeholders
      const stNodes = Array.isArray(doc.stakeholders) ? doc.stakeholders : [];
      walkStakeholders(stNodes, null, "stakeholders", valid, errors, { totalNodes: 0 }, dealId, groupNameRefs);
      totalNodes = valid.length + errors.length;

      return { valid, errors, totalRows: totalNodes, groups, tierConfig, orgLevels, groupNameRefs };
    }

    // 旧フォーマット: ルートが配列（Stakeholderのみ）
    if (Array.isArray(parsed)) {
      const counter = { totalNodes: 0 };
      walkStakeholders(parsed, null, "root", valid, errors, counter, dealId, groupNameRefs);
      totalNodes = counter.totalNodes;
      return { valid, errors, totalRows: totalNodes, groups, tierConfig, orgLevels, groupNameRefs };
    }

    return {
      valid: [],
      errors: [{ row: 0, message: "YAMLのルートは配列またはオブジェクトである必要があります", data: {} }],
      totalRows: 0,
      groups, tierConfig, orgLevels, groupNameRefs,
    };
  } catch (e) {
    return {
      valid: [],
      errors: [{ row: 0, message: `YAMLパースエラー: ${(e as Error).message}`, data: {} }],
      totalRows: 0,
      groups, tierConfig, orgLevels, groupNameRefs,
    };
  }
}

/** Stakeholderノードの再帰パース */
function walkStakeholders(
  nodes: unknown[],
  parentId: string | null,
  path: string,
  valid: Stakeholder[],
  errors: ParseError[],
  counter: { totalNodes: number },
  dealId: string,
  groupNameRefs: Map<string, string>,
) {
  for (let i = 0; i < nodes.length; i++) {
    const raw = nodes[i];
    counter.totalNodes++;
    const currentPath = `${path}[${i}]`;

    if (typeof raw !== "object" || raw === null) {
      errors.push({ row: counter.totalNodes, message: `${currentPath}: オブジェクトではありません`, data: {} });
      continue;
    }

    const node = raw as Record<string, unknown>;

    if (!node.name || typeof node.name !== "string") {
      errors.push({ row: counter.totalNodes, message: `${currentPath}: name（氏名）は必須です`, data: node as Record<string, string> });
      continue;
    }

    let influenceLevel: InfluenceLevel = 3;
    if (node.influence_level !== undefined) {
      const level = Number(node.influence_level);
      if (level >= 1 && level <= 5) influenceLevel = level as InfluenceLevel;
    }

    let attitude: Attitude = "neutral";
    if (node.attitude && VALID_ATTITUDES.includes(node.attitude as Attitude)) {
      attitude = node.attitude as Attitude;
    }

    let roleInDeal: RoleInDeal = "unknown";
    if (node.role_in_deal && VALID_ROLES.includes(node.role_in_deal as RoleInDeal)) {
      roleInDeal = node.role_in_deal as RoleInDeal;
    }

    // グループ参照: group（名前） or group_id（UUID）
    const groupRef = typeof node.group === "string" ? node.group : null;
    const groupId = typeof node.group_id === "string" ? node.group_id : null;

    const stakeholder: Stakeholder = {
      id: crypto.randomUUID(),
      dealId,
      name: String(node.name),
      department: String(node.department ?? ""),
      title: String(node.title ?? ""),
      roleInDeal,
      influenceLevel,
      attitude,
      mission: String(node.mission ?? ""),
      relationshipOwner: String(node.relationship_owner ?? ""),
      parentId: parentId,
      email: String(node.email ?? ""),
      phone: String(node.phone ?? ""),
      notes: String(node.notes ?? ""),
      orgLevel: node.org_level != null ? Number(node.org_level) : 5,
      groupId: groupId,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // group名参照があればマッピングを記録（後でIDに解決）
    if (groupRef) {
      groupNameRefs.set(stakeholder.id, groupRef);
    }

    valid.push(stakeholder);

    if (Array.isArray(node.children)) {
      walkStakeholders(node.children, stakeholder.id, `${currentPath}.children`, valid, errors, counter, dealId, groupNameRefs);
    }
  }
}

// ----------------------------
// エクスポート: 構造化YAMLフォーマット
// ----------------------------

interface ExportOptions {
  orgGroups?: OrgGroup[];
  tierConfig?: TierEntry[];
  orgLevels?: OrgLevelEntry[];
}

export function exportYAML(stakeholders: Stakeholder[], options?: ExportOptions): string {
  const { orgGroups, tierConfig, orgLevels } = options ?? {};
  const hasMetadata = (orgGroups && orgGroups.length > 0) || (tierConfig && tierConfig.length > 0) || (orgLevels && orgLevels.length > 0);

  // グループID→名前マップ
  const groupNameMap = new Map<string, string>();
  if (orgGroups) {
    for (const g of orgGroups) groupNameMap.set(g.id, g.name);
  }

  // --- Stakeholderツリー構築 ---
  interface SNode {
    _id: string;
    name: string;
    [key: string]: unknown;
    children: SNode[];
  }

  const nodeMap = new Map<string, SNode>();
  const roots: SNode[] = [];

  for (const s of stakeholders) {
    const groupName = s.groupId ? groupNameMap.get(s.groupId) : undefined;
    nodeMap.set(s.id, {
      _id: s.id,
      name: s.name,
      ...(s.title && { title: s.title }),
      ...(s.roleInDeal !== "unknown" && { role_in_deal: s.roleInDeal }),
      ...(s.influenceLevel !== 3 && { influence_level: s.influenceLevel }),
      ...(s.attitude !== "neutral" && { attitude: s.attitude }),
      ...(s.mission && { mission: s.mission }),
      ...(s.relationshipOwner && { relationship_owner: s.relationshipOwner }),
      ...(s.email && { email: s.email }),
      ...(s.phone && { phone: s.phone }),
      ...(s.notes && { notes: s.notes }),
      ...(s.orgLevel != null && { org_level: s.orgLevel }),
      ...(groupName ? { group: groupName } : s.groupId ? { group_id: s.groupId } : {}),
      children: [],
    });
  }

  for (const s of stakeholders) {
    const node = nodeMap.get(s.id)!;
    if (s.parentId && nodeMap.has(s.parentId)) {
      nodeMap.get(s.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const cleanStakeholders = (nodes: SNode[]): Record<string, unknown>[] =>
    nodes.map((node) => {
      const { _id, children, ...rest } = node;
      return {
        ...rest,
        ...(children.length > 0 ? { children: cleanStakeholders(children) } : {}),
      };
    });

  // メタデータがなければ旧フォーマット（配列）
  if (!hasMetadata) {
    return yaml.dump(cleanStakeholders(roots), { lineWidth: -1, noRefs: true, sortKeys: false });
  }

  // --- 新フォーマット: 構造化オブジェクト ---
  // グループツリー構築
  const buildGroupTree = (groups: OrgGroup[]): Record<string, unknown>[] => {
    const topLevel = groups.filter((g) => !g.parentGroupId);
    const getChildren = (parentId: string): Record<string, unknown>[] => {
      const kids = groups.filter((g) => g.parentGroupId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
      return kids.map((g) => ({
        name: g.name,
        ...(g.tier !== 0 && { tier: g.tier }),
        ...(g.color && { color: g.color }),
        ...(getChildren(g.id).length > 0 ? { children: getChildren(g.id) } : {}),
      }));
    };
    return topLevel.sort((a, b) => a.sortOrder - b.sortOrder).map((g) => ({
      name: g.name,
      ...(g.tier !== 0 && { tier: g.tier }),
      ...(g.color && { color: g.color }),
      ...(getChildren(g.id).length > 0 ? { children: getChildren(g.id) } : {}),
    }));
  };

  const doc: Record<string, unknown> = {};

  if (tierConfig && tierConfig.length > 0) {
    doc.tier_config = tierConfig.map((t) => ({ tier: t.tier, label: t.label }));
  }

  if (orgLevels && orgLevels.length > 0) {
    doc.org_levels = orgLevels.map((l) => ({ level: l.level, label: l.label }));
  }

  if (orgGroups && orgGroups.length > 0) {
    doc.groups = buildGroupTree(orgGroups);
  }

  doc.stakeholders = cleanStakeholders(roots);

  return yaml.dump(doc, { lineWidth: -1, noRefs: true, sortKeys: false });
}

// ----------------------------
// YAMLファイルダウンロード
// ----------------------------

export function downloadYAML(yamlString: string, filename: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + yamlString], {
    type: "text/yaml;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ----------------------------
// テンプレートYAML
// ----------------------------

export const YAML_TEMPLATE = `tier_config:
  - tier: 0
    label: 部署

org_levels:
  - level: 1
    label: 代表取締役社長
  - level: 2
    label: 本部長
  - level: 3
    label: 部長

groups:
  - name: 経営企画部
  - name: 営業本部
    children:
      - name: 営業一部

stakeholders:
  - name: 山田太郎
    title: 代表取締役社長
    group: 経営企画部
    role_in_deal: decision_maker
    influence_level: 5
    attitude: supportive
    mission: 中期経営計画の推進
    org_level: 1
    children:
      - name: 鈴木一郎
        title: 営業本部長
        group: 営業本部
        org_level: 2
        children:
          - name: 佐藤花子
            title: 営業一部長
            group: 営業一部
            org_level: 3
`;
