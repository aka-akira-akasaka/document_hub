import type { Attitude, InfluenceLevel, RoleInDeal } from "@/types/stakeholder";
import type { DealStage } from "@/types/deal";
import type { RelationshipType } from "@/types/relationship";

export const ATTITUDE_COLORS: Record<
  Attitude,
  { bg: string; text: string; border: string; cardBg: string; stripColor: string; avatarBg: string; avatarText: string }
> = {
  promoter: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-400",
    cardBg: "bg-green-50",
    stripColor: "bg-green-400",
    avatarBg: "bg-green-100",
    avatarText: "text-green-600",
  },
  supportive: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-400",
    cardBg: "bg-blue-50",
    stripColor: "bg-blue-400",
    avatarBg: "bg-blue-100",
    avatarText: "text-blue-600",
  },
  neutral: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
    cardBg: "bg-white",
    stripColor: "",
    avatarBg: "bg-gray-100",
    avatarText: "text-gray-400",
  },
  cautious: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-400",
    cardBg: "bg-amber-50",
    stripColor: "bg-amber-400",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-600",
  },
  opposed: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-400",
    cardBg: "bg-red-50",
    stripColor: "bg-red-400",
    avatarBg: "bg-red-100",
    avatarText: "text-red-600",
  },
};

export const ATTITUDE_LABELS: Record<Attitude, string> = {
  promoter: "推進",
  supportive: "賛成",
  neutral: "中立",
  cautious: "慎重",
  opposed: "反対",
};

export const ATTITUDE_OPTIONS: Attitude[] = [
  "promoter",
  "supportive",
  "neutral",
  "cautious",
  "opposed",
];

export const INFLUENCE_LABELS: Record<InfluenceLevel, string> = {
  1: "非常に低い",
  2: "低い",
  3: "中程度",
  4: "高い",
  5: "非常に高い",
};

export const ROLE_LABELS: Record<RoleInDeal, string> = {
  decision_maker: "決裁者",
  approver: "承認者",
  initiator: "起案者",
  evaluator: "評価者",
  user: "利用者",
  gatekeeper: "管理部門",
  unknown: "不明",
};

export const ROLE_OPTIONS: RoleInDeal[] = [
  "decision_maker",
  "approver",
  "initiator",
  "evaluator",
  "user",
  "gatekeeper",
  "unknown",
];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  prospecting: "初期接触",
  qualification: "条件確認",
  proposal: "提案中",
  negotiation: "交渉中",
  closed_won: "成約",
  closed_lost: "失注",
  on_hold: "保留",
};

export const DEAL_STAGE_OPTIONS: DealStage[] = [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
  "on_hold",
];

export const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  prospecting: "bg-slate-100 text-slate-700",
  qualification: "bg-yellow-100 text-yellow-700",
  proposal: "bg-blue-100 text-blue-700",
  negotiation: "bg-purple-100 text-purple-700",
  closed_won: "bg-green-100 text-green-700",
  closed_lost: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-700",
};

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  reporting: "上下関係",
  influence: "影響関係",
  alliance: "同盟関係",
  rivalry: "対立関係",
  informal: "非公式",
  oversight: "管掌",
};

export const RELATIONSHIP_TYPE_OPTIONS: RelationshipType[] = [
  "reporting",
  "influence",
  "alliance",
  "rivalry",
  "informal",
  "oversight",
];

/** レイヤーベースレイアウトの設定定数 */
export const LAYER_LAYOUT = {
  nodeWidth: 180,
  nodeHeight: 72,
  /** レイヤーの上下余白 */
  layerPadding: 40,
  /** 同レイヤー内の水平ノード間隔 */
  nodeSep: 40,
} as const;

/** グループの最大ネスト深度 */
export const MAX_GROUP_DEPTH = 20;

/** グループベースレイアウトの設定定数 */
export const GROUP_LAYOUT = {
  /** stakeholderノード幅 */
  nodeWidth: 180,
  /** stakeholderノード高さ */
  nodeHeight: 72,
  /** グループヘッダーの高さ */
  headerHeight: 40,
  /** グループフッターの高さ（＋人を追加する） */
  footerHeight: 32,
  /** グループ内部のパディング */
  innerPadding: 12,
  /** ノード間の縦間隔 */
  nodeGap: 8,
  /** サブグループ間の横間隔 */
  subGroupGap: 16,
  /** division間の横間隔 */
  divisionGap: 32,
  /** フリーフローティング領域のY起点 */
  freeFloatY: 0,
  /** グループ領域のY起点 */
  groupAreaY: 200,
  /** フリーフローティングノード間の横間隔 */
  freeFloatGap: 24,
  /** 「人を追加する」プレースホルダーの高さ */
  placeholderHeight: 32,
} as const;

/** 関係線のポジティブ/ネガティブ判定 */
export function isPositiveRelationship(type: RelationshipType): boolean {
  return type === "alliance" || type === "influence" || type === "informal" || type === "oversight";
}

/** 関係線の表示ラベル（ピル内テキスト） */
export const RELATIONSHIP_EDGE_LABELS: Record<RelationshipType, string> = {
  reporting: "上下関係",
  influence: "ポジティブな関係",
  alliance: "ポジティブな関係",
  rivalry: "ネガティブな関係",
  informal: "ポジティブな関係",
  oversight: "管掌",
};

/**
 * デフォルト組織階層（新規案件や未設定時に使用）
 */
export const DEFAULT_ORG_LEVELS: { level: number; label: string }[] = [
  { level: 1, label: "役員" },
  { level: 2, label: "部長" },
  { level: 3, label: "次長" },
  { level: 4, label: "課長" },
  { level: 5, label: "係長/主任" },
];

/**
 * 2つのorgLevel間に挿入可能な役職リストを返す
 * dealLevels: 案件固有の階層定義（指定がなければデフォルトを使用）
 * 例: parentLevel=2(部長), childLevel=4(課長) → [{ level: 3, label: "次長" }]
 */
export function getInsertableLevels(
  parentLevel: number | undefined,
  childLevel: number | undefined,
  dealLevels?: { level: number; label: string }[]
): { level: number; label: string }[] {
  if (parentLevel == null || childLevel == null) return [];
  if (childLevel - parentLevel <= 1) return [];

  const levels = dealLevels && dealLevels.length > 0 ? dealLevels : DEFAULT_ORG_LEVELS;
  const levelMap = new Map(levels.map((l) => [l.level, l.label]));

  const result: { level: number; label: string }[] = [];
  for (let level = parentLevel + 1; level < childLevel; level++) {
    const label = levelMap.get(level);
    if (label) {
      result.push({ level, label });
    }
  }
  return result;
}
