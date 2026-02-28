export interface CsvRow {
  id: string;
  name: string;
  department: string;
  title: string;
  role_in_deal: string;
  influence_level: string;
  attitude: string;
  relationship_owner: string;
  parent_id: string;
  email: string;
  phone: string;
  notes: string;
}

export const CSV_COLUMNS: (keyof CsvRow)[] = [
  "id",
  "name",
  "department",
  "title",
  "role_in_deal",
  "influence_level",
  "attitude",
  "relationship_owner",
  "parent_id",
  "email",
  "phone",
  "notes",
];
