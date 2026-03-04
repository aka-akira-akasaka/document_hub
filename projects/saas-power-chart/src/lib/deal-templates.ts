/**
 * 案件テンプレート定義
 *
 * 新規案件作成後の空キャンバスで表示されるテンプレート一覧。
 * 選択すると部署構成とプレースホルダー人物が一括生成される。
 */

import type { RoleInDeal, InfluenceLevel, Attitude } from "@/types/stakeholder";

// --- 型定義 ---

export interface TemplateGroup {
  refKey: string;
  name: string;
  parentRefKey: string | null;
  color?: string;
  /** 縦軸レイヤー: 0=通常部署（デフォルト）, 1以上=上位会議体 */
  tier?: number;
}

export interface TemplateStakeholder {
  refKey: string;
  name: string;
  title: string;
  department: string;
  roleInDeal: RoleInDeal;
  influenceLevel: InfluenceLevel;
  attitude: Attitude;
  orgLevel: number;
  groupRefKey: string | null; // null = フリーフローティング
  parentRefKey: string | null; // 上司の stakeholder refKey
}

export interface TemplateOrgLevel {
  level: number;
  label: string;
}

export interface DealTemplate {
  id: string;
  name: string;
  description: string;
  groupCount: number;
  stakeholderCount: number;
  orgLevels: TemplateOrgLevel[];
  groups: TemplateGroup[];
  stakeholders: TemplateStakeholder[];
}

// --- テンプレートデータ ---

const BANK: DealTemplate = {
  id: "bank",
  name: "銀行",
  description: "役員会・本店営業部・融資部・審査部など銀行の典型的な組織構成",
  groupCount: 8,
  stakeholderCount: 6,
  orgLevels: [
    { level: 1, label: "頭取" },
    { level: 2, label: "副頭取" },
    { level: 3, label: "部長" },
    { level: 4, label: "次長" },
    { level: 5, label: "課長" },
    { level: 6, label: "担当者" },
  ],
  groups: [
    // 上位会議体（tier 1）
    { refKey: "yakuinkai", name: "役員会", parentRefKey: null, tier: 1 },
    // 通常部署（tier 0）
    { refKey: "honten-eigyo", name: "本店営業部", parentRefKey: null },
    { refKey: "houjin-eigyo", name: "法人営業部", parentRefKey: null },
    { refKey: "yuushi", name: "融資部", parentRefKey: null },
    { refKey: "shinsa", name: "審査部", parentRefKey: null },
    { refKey: "sogo-kikaku", name: "総合企画部", parentRefKey: null },
    { refKey: "risk", name: "リスク管理部", parentRefKey: null },
    { refKey: "digital", name: "デジタル戦略部", parentRefKey: null },
  ],
  stakeholders: [
    {
      refKey: "todori",
      name: "（頭取）",
      title: "頭取",
      department: "役員会",
      roleInDeal: "decision_maker",
      influenceLevel: 5,
      attitude: "neutral",
      orgLevel: 1,
      groupRefKey: "yakuinkai",
      parentRefKey: null,
    },
    {
      refKey: "fuku-todori",
      name: "（副頭取）",
      title: "副頭取",
      department: "役員会",
      roleInDeal: "approver",
      influenceLevel: 5,
      attitude: "neutral",
      orgLevel: 2,
      groupRefKey: "yakuinkai",
      parentRefKey: "todori",
    },
    {
      refKey: "honten-bucho",
      name: "（本店営業部長）",
      title: "部長",
      department: "本店営業部",
      roleInDeal: "initiator",
      influenceLevel: 4,
      attitude: "neutral",
      orgLevel: 3,
      groupRefKey: "honten-eigyo",
      parentRefKey: null,
    },
    {
      refKey: "yuushi-bucho",
      name: "（融資部長）",
      title: "部長",
      department: "融資部",
      roleInDeal: "approver",
      influenceLevel: 4,
      attitude: "neutral",
      orgLevel: 3,
      groupRefKey: "yuushi",
      parentRefKey: null,
    },
    {
      refKey: "shinsa-bucho",
      name: "（審査部長）",
      title: "部長",
      department: "審査部",
      roleInDeal: "gatekeeper",
      influenceLevel: 4,
      attitude: "neutral",
      orgLevel: 3,
      groupRefKey: "shinsa",
      parentRefKey: null,
    },
    {
      refKey: "kikaku-bucho",
      name: "（総合企画部長）",
      title: "部長",
      department: "総合企画部",
      roleInDeal: "evaluator",
      influenceLevel: 3,
      attitude: "neutral",
      orgLevel: 3,
      groupRefKey: "sogo-kikaku",
      parentRefKey: null,
    },
  ],
};

const BUSINESS_COMPANY: DealTemplate = {
  id: "business-company",
  name: "事業会社",
  description: "経営企画・情報システム・営業部など事業会社の典型的な組織構成",
  groupCount: 9,
  stakeholderCount: 4,
  orgLevels: [
    { level: 1, label: "代表取締役" },
    { level: 2, label: "取締役" },
    { level: 3, label: "部長" },
    { level: 4, label: "課長" },
    { level: 5, label: "担当者" },
  ],
  groups: [
    // 上位会議体（tier 1）
    { refKey: "keiei-kaigi", name: "経営会議", parentRefKey: null, tier: 1 },
    // 通常部署（tier 0）
    { refKey: "keiei-kikaku", name: "経営企画部", parentRefKey: null },
    { refKey: "jouhou", name: "情報システム部", parentRefKey: null },
    { refKey: "soumu", name: "総務部", parentRefKey: null },
    { refKey: "keiri", name: "経理部", parentRefKey: null },
    { refKey: "eigyo", name: "営業部", parentRefKey: null },
    { refKey: "eigyo-1", name: "営業一課", parentRefKey: "eigyo" },
    { refKey: "eigyo-2", name: "営業二課", parentRefKey: "eigyo" },
    { refKey: "seizou", name: "製造部", parentRefKey: null },
  ],
  stakeholders: [
    {
      refKey: "shacho",
      name: "（代表取締役）",
      title: "代表取締役",
      department: "経営会議",
      roleInDeal: "decision_maker",
      influenceLevel: 5,
      attitude: "neutral",
      orgLevel: 1,
      groupRefKey: "keiei-kaigi",
      parentRefKey: null,
    },
    {
      refKey: "kikaku-bucho",
      name: "（経営企画部長）",
      title: "部長",
      department: "経営企画部",
      roleInDeal: "evaluator",
      influenceLevel: 4,
      attitude: "neutral",
      orgLevel: 3,
      groupRefKey: "keiei-kikaku",
      parentRefKey: null,
    },
    {
      refKey: "jouhou-bucho",
      name: "（情報システム部長）",
      title: "部長",
      department: "情報システム部",
      roleInDeal: "initiator",
      influenceLevel: 4,
      attitude: "neutral",
      orgLevel: 3,
      groupRefKey: "jouhou",
      parentRefKey: null,
    },
    {
      refKey: "eigyo-bucho",
      name: "（営業部長）",
      title: "部長",
      department: "営業部",
      roleInDeal: "user",
      influenceLevel: 3,
      attitude: "neutral",
      orgLevel: 3,
      groupRefKey: "eigyo",
      parentRefKey: null,
    },
  ],
};

const BLANK: DealTemplate = {
  id: "blank",
  name: "空のキャンバス",
  description: "テンプレートを使わず手動で組織図を構築",
  groupCount: 0,
  stakeholderCount: 0,
  orgLevels: [],
  groups: [],
  stakeholders: [],
};

// --- エクスポート ---

export const DEAL_TEMPLATES: DealTemplate[] = [
  BANK,
  BUSINESS_COMPANY,
  BLANK,
];

export function getTemplateById(id: string): DealTemplate | undefined {
  return DEAL_TEMPLATES.find((t) => t.id === id);
}
