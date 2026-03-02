/** 組織グループ（部署） — 階層は parentGroupId チェーンで表現 */
export interface OrgGroup {
  id: string;
  dealId: string;
  name: string;
  /** ネスト: 親グループのIDを持つ（トップレベルはnull） */
  parentGroupId: string | null;
  /** グループの色（オプション） */
  color?: string;
  createdAt: string;
  updatedAt: string;
}
