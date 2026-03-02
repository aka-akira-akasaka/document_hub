/** 組織グループの階層レベル */
export type OrgGroupLevel = "division" | "section" | "team";

/** 組織グループ（部・課・係） */
export interface OrgGroup {
  id: string;
  dealId: string;
  name: string;
  /** division=部, section=課, team=係/班 */
  level: OrgGroupLevel;
  /** ネスト: sectionはdivisionのID、teamはsectionのIDを持つ */
  parentGroupId: string | null;
  /** グループの色（オプション） */
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export const ORG_GROUP_LEVEL_LABELS: Record<OrgGroupLevel, string> = {
  division: "部",
  section: "課",
  team: "係",
};

/** グループレベルの配色 */
export const ORG_GROUP_LEVEL_COLORS: Record<
  OrgGroupLevel,
  { bg: string; border: string; header: string }
> = {
  division: {
    bg: "rgba(255, 255, 255, 0.95)",
    border: "rgba(209, 213, 219, 0.6)",
    header: "rgba(249, 250, 251, 1)",
  },
  section: {
    bg: "rgba(255, 255, 255, 0.95)",
    border: "rgba(209, 213, 219, 0.6)",
    header: "rgba(249, 250, 251, 1)",
  },
  team: {
    bg: "rgba(255, 255, 255, 0.95)",
    border: "rgba(209, 213, 219, 0.6)",
    header: "rgba(249, 250, 251, 1)",
  },
};
