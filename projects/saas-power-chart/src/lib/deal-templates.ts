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

export interface DealTemplate {
  id: string;
  name: string;
  description: string;
  groupCount: number;
  stakeholderCount: number;
  groups: TemplateGroup[];
  stakeholders: TemplateStakeholder[];
}

// --- テンプレートデータ ---

const REGIONAL_BANK: DealTemplate = {
  id: "regional-bank",
  name: "地方銀行",
  description: "本店営業部・融資部・審査部など地銀の典型的な組織構成",
  groupCount: 9,
  stakeholderCount: 6,
  groups: [
    { refKey: "honten-eigyo", name: "本店営業部", parentRefKey: null },
    { refKey: "honten-houjin", name: "法人営業課", parentRefKey: "honten-eigyo" },
    { refKey: "honten-kojin", name: "個人営業課", parentRefKey: "honten-eigyo" },
    { refKey: "yuushi", name: "融資部", parentRefKey: null },
    { refKey: "yuushi-shinsa", name: "融資審査課", parentRefKey: "yuushi" },
    { refKey: "yuushi-kanri", name: "管理課", parentRefKey: "yuushi" },
    { refKey: "shinsa", name: "審査部", parentRefKey: null },
    { refKey: "jimu-kanri", name: "事務管理部", parentRefKey: null },
    { refKey: "sogo-kikaku", name: "総合企画部", parentRefKey: null },
  ],
  stakeholders: [
    {
      refKey: "todori",
      name: "（頭取）",
      title: "頭取",
      department: "経営",
      roleInDeal: "decision_maker",
      influenceLevel: 5,
      attitude: "neutral",
      orgLevel: 1,
      groupRefKey: null,
      parentRefKey: null,
    },
    {
      refKey: "fuku-todori",
      name: "（副頭取）",
      title: "副頭取",
      department: "経営",
      roleInDeal: "approver",
      influenceLevel: 5,
      attitude: "neutral",
      orgLevel: 1,
      groupRefKey: null,
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
      orgLevel: 2,
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
      orgLevel: 2,
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
      orgLevel: 2,
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
      orgLevel: 2,
      groupRefKey: "sogo-kikaku",
      parentRefKey: null,
    },
  ],
};

const MEGA_BANK: DealTemplate = {
  id: "mega-bank",
  name: "メガバンク",
  description: "法人営業部・RM部・審査部などメガバンクの大規模組織構成",
  groupCount: 10,
  stakeholderCount: 6,
  groups: [
    { refKey: "houjin-eigyo", name: "法人営業部", parentRefKey: null },
    { refKey: "houjin-dai", name: "大企業営業室", parentRefKey: "houjin-eigyo" },
    { refKey: "houjin-chuken", name: "中堅法人営業室", parentRefKey: "houjin-eigyo" },
    { refKey: "rm", name: "RM部", parentRefKey: null },
    { refKey: "shinsa", name: "審査部", parentRefKey: null },
    { refKey: "shinsa-houjin", name: "法人審査課", parentRefKey: "shinsa" },
    { refKey: "shinsa-yoshin", name: "与信管理課", parentRefKey: "shinsa" },
    { refKey: "sf", name: "ストラクチャードファイナンス部", parentRefKey: null },
    { refKey: "risk", name: "リスク管理部", parentRefKey: null },
    { refKey: "digital", name: "デジタル戦略部", parentRefKey: null },
  ],
  stakeholders: [
    {
      refKey: "todori",
      name: "（頭取）",
      title: "頭取",
      department: "経営",
      roleInDeal: "decision_maker",
      influenceLevel: 5,
      attitude: "neutral",
      orgLevel: 1,
      groupRefKey: null,
      parentRefKey: null,
    },
    {
      refKey: "fuku-todori",
      name: "（副頭取）",
      title: "副頭取",
      department: "経営",
      roleInDeal: "approver",
      influenceLevel: 5,
      attitude: "neutral",
      orgLevel: 1,
      groupRefKey: null,
      parentRefKey: "todori",
    },
    {
      refKey: "houjin-bucho",
      name: "（法人営業部長）",
      title: "部長",
      department: "法人営業部",
      roleInDeal: "initiator",
      influenceLevel: 4,
      attitude: "neutral",
      orgLevel: 2,
      groupRefKey: "houjin-eigyo",
      parentRefKey: null,
    },
    {
      refKey: "rm-bucho",
      name: "（RM部長）",
      title: "部長",
      department: "RM部",
      roleInDeal: "evaluator",
      influenceLevel: 4,
      attitude: "neutral",
      orgLevel: 2,
      groupRefKey: "rm",
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
      orgLevel: 2,
      groupRefKey: "shinsa",
      parentRefKey: null,
    },
    {
      refKey: "digital-bucho",
      name: "（デジタル戦略部長）",
      title: "部長",
      department: "デジタル戦略部",
      roleInDeal: "evaluator",
      influenceLevel: 3,
      attitude: "neutral",
      orgLevel: 2,
      groupRefKey: "digital",
      parentRefKey: null,
    },
  ],
};

const GENERAL_COMPANY: DealTemplate = {
  id: "general-company",
  name: "一般企業",
  description: "経営企画・情報システム・営業部など一般的な企業の組織構成",
  groupCount: 8,
  stakeholderCount: 4,
  groups: [
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
      department: "経営",
      roleInDeal: "decision_maker",
      influenceLevel: 5,
      attitude: "neutral",
      orgLevel: 1,
      groupRefKey: null,
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
      orgLevel: 2,
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
      orgLevel: 2,
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
      orgLevel: 2,
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
  groups: [],
  stakeholders: [],
};

// --- エクスポート ---

export const DEAL_TEMPLATES: DealTemplate[] = [
  REGIONAL_BANK,
  MEGA_BANK,
  GENERAL_COMPANY,
  BLANK,
];

export function getTemplateById(id: string): DealTemplate | undefined {
  return DEAL_TEMPLATES.find((t) => t.id === id);
}
