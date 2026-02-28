export type DealStage =
  | "prospecting"
  | "qualification"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost"
  | "on_hold";

export interface Deal {
  id: string;
  name: string;
  clientName: string;
  stage: DealStage;
  description: string;
  targetAmount?: number;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
}
