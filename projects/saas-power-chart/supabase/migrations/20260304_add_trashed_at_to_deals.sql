-- deals テーブルに trashed_at カラムを追加（ゴミ箱機能のソフトデリート用）
-- Supabase SQL Editor で実行してください

alter table public.deals
  add column if not exists trashed_at timestamptz;
