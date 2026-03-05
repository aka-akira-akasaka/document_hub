import type { ShareRole } from "./deal-share";

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
  /** 共有案件の権限（オーナーの場合はundefined） */
  shareRole?: ShareRole;
  /** 共有案件のオーナーメール（オーナーの場合はundefined） */
  ownerEmail?: string;
  createdAt: string;
  updatedAt: string;
}
