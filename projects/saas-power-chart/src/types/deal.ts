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
  /** ゴミ箱に移動した日時（null/undefined = アクティブ） */
  trashedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
