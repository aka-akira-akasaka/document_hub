export type RelationshipType =
  | "reporting"
  | "influence"
  | "alliance"
  | "rivalry"
  | "informal";

export interface Relationship {
  id: string;
  dealId: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label?: string;
  bidirectional: boolean;
  createdAt: string;
}
