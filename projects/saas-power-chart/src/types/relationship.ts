export type RelationshipType =
  | "reporting"
  | "influence"
  | "alliance"
  | "rivalry"
  | "informal"
  | "oversight";

/** 接続先の種類 */
export type RelationshipTargetType = "stakeholder" | "group";

/** 矢印の方向 */
export type RelationshipDirection = "forward" | "reverse" | "bidirectional" | "none";

export interface Relationship {
  id: string;
  dealId: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label?: string;
  bidirectional: boolean;
  /** 矢印の方向（省略時は bidirectional フラグから導出） */
  direction?: RelationshipDirection;
  /** コネクタとラベルのカスタム色（省略時はタイプに応じた既定色） */
  color?: string;
  /** 接続先の種類（省略時は "stakeholder"） */
  targetType?: RelationshipTargetType;
  /** 接続元の種類（省略時は "stakeholder"） */
  sourceType?: RelationshipTargetType;
  /** ユーザーが接続操作で指定したソースハンドルID */
  sourceHandle?: string;
  /** ユーザーが接続操作で指定したターゲットハンドルID */
  targetHandle?: string;
  createdAt: string;
}
