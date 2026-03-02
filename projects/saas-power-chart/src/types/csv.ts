export interface CsvRow {
  id: string;
  name: string;
  department: string;
  title: string;
  role_in_deal: string;
  influence_level: string;
  attitude: string;
  mission: string;
  relationship_owner: string;
  parent_id: string;
  email: string;
  phone: string;
  notes: string;
  org_level: string;
  group_id: string;
}

export const CSV_COLUMNS: (keyof CsvRow)[] = [
  "id",
  "name",
  "department",
  "title",
  "role_in_deal",
  "influence_level",
  "attitude",
  "mission",
  "relationship_owner",
  "parent_id",
  "email",
  "phone",
  "notes",
  "org_level",
  "group_id",
];

/** Japanese display names for CSV columns */
export const CSV_COLUMN_LABELS: Record<keyof CsvRow, string> = {
  id: "ID",
  name: "氏名",
  department: "部署",
  title: "役職",
  role_in_deal: "案件での役割",
  influence_level: "影響力",
  attitude: "態度",
  mission: "ミッション",
  relationship_owner: "関係構築担当",
  parent_id: "上位者ID",
  email: "メール",
  phone: "電話番号",
  notes: "備考",
  org_level: "組織階層レベル",
  group_id: "所属グループID",
};

/** Reverse mapping: Japanese label → English key */
export const CSV_LABEL_TO_COLUMN: Record<string, keyof CsvRow> = Object.fromEntries(
  Object.entries(CSV_COLUMN_LABELS).map(([key, label]) => [label.toLowerCase(), key])
) as Record<string, keyof CsvRow>;

/** Example row for template CSV */
export const CSV_TEMPLATE_EXAMPLE: Record<keyof CsvRow, string> = {
  id: "",
  name: "山田太郎",
  department: "経営企画部",
  title: "部長",
  role_in_deal: "decision_maker",
  influence_level: "5",
  attitude: "supportive",
  mission: "中期経営計画の推進",
  relationship_owner: "佐藤",
  parent_id: "",
  email: "yamada@example.com",
  phone: "03-1234-5678",
  notes: "最終決裁者",
  org_level: "2",
  group_id: "",
};
