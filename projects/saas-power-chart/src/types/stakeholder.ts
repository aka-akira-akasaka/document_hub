export type RoleInDeal =
  | "decision_maker"
  | "approver"
  | "initiator"
  | "evaluator"
  | "user"
  | "gatekeeper"
  | "unknown";

export type InfluenceLevel = 1 | 2 | 3 | 4 | 5;

export type Attitude =
  | "promoter"
  | "supportive"
  | "neutral"
  | "cautious"
  | "opposed";

export interface Stakeholder {
  id: string;
  dealId: string;
  name: string;
  department: string;
  title: string;
  roleInDeal: RoleInDeal;
  influenceLevel: InfluenceLevel;
  attitude: Attitude;
  mission: string;
  relationshipOwner: string;
  parentId: string | null;
  email: string;
  phone: string;
  notes: string;
  /** 組織階層レベル（1=役員, 2=部長, 3=課長, 4=係長/主任 ...） */
  orgLevel: number;
  /** 所属するOrgGroupのID。nullならフリーフローティング */
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}
