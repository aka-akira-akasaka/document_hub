-- deals テーブルに shared_emails カラムを追加（共有メンバー情報の非正規化）
-- RLS の自己参照制約を回避し、全共有者が互いの情報を参照可能にする
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS shared_emails jsonb DEFAULT '[]';
