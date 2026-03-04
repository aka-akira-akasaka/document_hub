/** 組織グループ（部署） — 階層は parentGroupId チェーンで表現 */
export interface OrgGroup {
  id: string;
  dealId: string;
  name: string;
  /** ネスト: 親グループのIDを持つ（トップレベルはnull） */
  parentGroupId: string | null;
  /** グループの色（オプション） */
  color?: string;
  /** 同一親グループ内での表示順序（横並びD&D入れ替え用） */
  sortOrder: number;
  /** 縦軸レイヤー: 0=通常部署, 1以上=上位会議体（大きいほど上段に表示） */
  tier: number;
  createdAt: string;
  updatedAt: string;
}
