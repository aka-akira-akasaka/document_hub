export type RoleInDeal =
  | "decision_maker"
  | "influencer"
  | "champion"
  | "coach"
  | "gatekeeper"
  | "user"
  | "evaluator"
  | "unknown";

export type InfluenceLevel = 1 | 2 | 3 | 4 | 5;

export type Attitude =
  | "champion"
  | "supporter"
  | "neutral"
  | "opponent"
  | "blocker";

export interface Stakeholder {
  id: string;
  dealId: string;
  name: string;
  department: string;
  title: string;
  roleInDeal: RoleInDeal;
  influenceLevel: InfluenceLevel;
  attitude: Attitude;
  relationshipOwner: string;
  parentId: string | null;
  email: string;
  phone: string;
  notes: string;
  position?: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}
