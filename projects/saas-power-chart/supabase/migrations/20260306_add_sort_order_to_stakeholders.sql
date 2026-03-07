-- ステークホルダーに表示順序カラムを追加（同一グループ・同一orgLevel内での並び順）
alter table public.stakeholders
  add column if not exists sort_order integer not null default 0;
