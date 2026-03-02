export type RelationshipType =
  | "reporting"
  | "influence"
  | "alliance"
  | "rivalry"
  | "informal"
  | "oversight";

/** 接続先の種類 */
export type RelationshipTargetType = "stakeholder" | "group";

export interface Relationship {
  id: string;
  dealId: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label?: string;
  bidirectional: boolean;
  /** 接続先の種類（省略時は "stakeholder"） */
  targetType?: RelationshipTargetType;
  createdAt: string;
}
