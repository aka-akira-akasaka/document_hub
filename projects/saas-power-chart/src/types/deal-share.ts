/** 共有権限の種別 */
export type ShareRole = "viewer" | "editor";

/** 案件共有レコード */
export interface DealShare {
  id: string;
  dealId: string;
  ownerId: string;
  sharedWithEmail: string;
  sharedWithUserId: string | null;
  role: ShareRole;
  createdAt: string;
  updatedAt: string;
}
