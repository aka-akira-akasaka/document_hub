import yaml from "js-yaml";
import type { Stakeholder, RoleInDeal, Attitude, InfluenceLevel } from "@/types/stakeholder";
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
  children?: YamlOrgNode[];
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
// YAML → Stakeholder[] パース
// ----------------------------

export function parseYAML(yamlText: string, dealId: string): ParseResult {
  const valid: Stakeholder[] = [];
  const errors: ParseError[] = [];
  let totalNodes = 0;

  try {
    const parsed = yaml.load(yamlText);
    if (!Array.isArray(parsed)) {
      return {
        valid: [],
        errors: [{ row: 0, message: "YAMLのルートは配列である必要があります", data: {} }],
        totalRows: 0,
      };
    }

    const walk = (nodes: unknown[], parentId: string | null, path: string) => {
      for (let i = 0; i < nodes.length; i++) {
        const raw = nodes[i];
        totalNodes++;
        const currentPath = `${path}[${i}]`;

        if (typeof raw !== "object" || raw === null) {
          errors.push({
            row: totalNodes,
            message: `${currentPath}: オブジェクトではありません`,
            data: {},
          });
          continue;
        }

        const node = raw as Record<string, unknown>;

        // 氏名は必須
        if (!node.name || typeof node.name !== "string") {
          errors.push({
            row: totalNodes,
            message: `${currentPath}: name（氏名）は必須です`,
            data: node as Record<string, string>,
          });
          continue;
        }

        // 影響力のバリデーション
        let influenceLevel: InfluenceLevel = 3;
        if (node.influence_level !== undefined) {
          const level = Number(node.influence_level);
          if (level >= 1 && level <= 5) {
            influenceLevel = level as InfluenceLevel;
          }
        }

        // 態度のバリデーション
        let attitude: Attitude = "neutral";
        if (node.attitude && VALID_ATTITUDES.includes(node.attitude as Attitude)) {
          attitude = node.attitude as Attitude;
        }

        // 役割のバリデーション
        let roleInDeal: RoleInDeal = "unknown";
        if (node.role_in_deal && VALID_ROLES.includes(node.role_in_deal as RoleInDeal)) {
          roleInDeal = node.role_in_deal as RoleInDeal;
        }

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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        valid.push(stakeholder);

        // 子ノードの再帰処理
        if (Array.isArray(node.children)) {
          walk(node.children, stakeholder.id, `${currentPath}.children`);
        }
      }
    };

    walk(parsed, null, "root");
  } catch (e) {
    return {
      valid: [],
      errors: [{ row: 0, message: `YAMLパースエラー: ${(e as Error).message}`, data: {} }],
      totalRows: 0,
    };
  }

  return { valid, errors, totalRows: totalNodes };
}

// ----------------------------
// Stakeholder[] → YAMLツリー構造にエクスポート
// ----------------------------

interface ExportNode {
  _id: string;
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
  children: ExportNode[];
}

export function exportYAML(stakeholders: Stakeholder[]): string {
  // フラット配列をツリー構造に変換
  const nodeMap = new Map<string, ExportNode>();
  const roots: ExportNode[] = [];

  // 全ノードをMapに登録
  for (const s of stakeholders) {
    nodeMap.set(s.id, {
      _id: s.id,
      name: s.name,
      ...(s.title && { title: s.title }),
      ...(s.department && { department: s.department }),
      ...(s.roleInDeal !== "unknown" && { role_in_deal: s.roleInDeal }),
      ...(s.influenceLevel !== 3 && { influence_level: s.influenceLevel }),
      ...(s.attitude !== "neutral" && { attitude: s.attitude }),
      ...(s.mission && { mission: s.mission }),
      ...(s.relationshipOwner && { relationship_owner: s.relationshipOwner }),
      ...(s.email && { email: s.email }),
      ...(s.phone && { phone: s.phone }),
      ...(s.notes && { notes: s.notes }),
      ...(s.orgLevel != null && { org_level: s.orgLevel }),
      children: [],
    });
  }

  // 親子関係を構築
  for (const s of stakeholders) {
    const node = nodeMap.get(s.id)!;
    if (s.parentId && nodeMap.has(s.parentId)) {
      nodeMap.get(s.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // _id と空の children を除去してクリーンなYAMLを生成
  const clean = (nodes: ExportNode[]): YamlOrgNode[] =>
    nodes.map((node) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, children, ...rest } = node;
      return {
        ...rest,
        ...(children.length > 0 ? { children: clean(children) } : {}),
      };
    });

  return yaml.dump(clean(roots), {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
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

export const YAML_TEMPLATE = `- name: 山田太郎
  title: 代表取締役社長
  department: 経営企画
  role_in_deal: decision_maker
  influence_level: 5
  attitude: supportive
  mission: 中期経営計画の推進
  org_level: 1
  children:
    - name: 鈴木一郎
      title: 営業本部長
      department: 営業本部
      org_level: 2
      children:
        - name: 佐藤花子
          title: 営業一部長
          department: 営業一部
          org_level: 3
`;
