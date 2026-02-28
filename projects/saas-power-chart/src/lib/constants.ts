import type { Attitude, InfluenceLevel, RoleInDeal } from "@/types/stakeholder";
import type { DealStage } from "@/types/deal";
import type { RelationshipType } from "@/types/relationship";

export const ATTITUDE_COLORS: Record<
  Attitude,
  { bg: string; text: string; border: string }
> = {
  champion: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-400",
  },
  supporter: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-400",
  },
  neutral: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-400",
  },
  opponent: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-400",
  },
  blocker: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-400",
  },
};

export const ATTITUDE_LABELS: Record<Attitude, string> = {
  champion: "チャンピオン",
  supporter: "支持者",
  neutral: "中立",
  opponent: "反対者",
  blocker: "障害者",
};

export const ATTITUDE_OPTIONS: Attitude[] = [
  "champion",
  "supporter",
  "neutral",
  "opponent",
  "blocker",
];

export const INFLUENCE_LABELS: Record<InfluenceLevel, string> = {
  1: "非常に低い",
  2: "低い",
  3: "中程度",
  4: "高い",
  5: "非常に高い",
};

export const ROLE_LABELS: Record<RoleInDeal, string> = {
  decision_maker: "意思決定者",
  influencer: "影響者",
  champion: "チャンピオン",
  coach: "コーチ",
  gatekeeper: "ゲートキーパー",
  user: "ユーザー",
  evaluator: "評価者",
  unknown: "不明",
};

export const ROLE_OPTIONS: RoleInDeal[] = [
  "decision_maker",
  "influencer",
  "champion",
  "coach",
  "gatekeeper",
  "user",
  "evaluator",
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
};

export const RELATIONSHIP_TYPE_OPTIONS: RelationshipType[] = [
  "reporting",
  "influence",
  "alliance",
  "rivalry",
  "informal",
];
