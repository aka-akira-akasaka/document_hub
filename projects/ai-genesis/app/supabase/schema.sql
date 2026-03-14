-- Echo - AIジャーナル データベーススキーマ
-- Supabase (PostgreSQL) に実行する

-- UUID拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ユーザーテーブル ─────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  apple_id TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'pro')),
  notification_hour INT NOT NULL DEFAULT 8
    CHECK (notification_hour >= 0 AND notification_hour <= 23),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS（行レベルセキュリティ）を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ読み書き可能
CREATE POLICY "users: own data only" ON users
  FOR ALL USING (auth.uid() = id);

-- ─── エントリテーブル ─────────────────────────────────

CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transcription TEXT NOT NULL,
  audio_url TEXT,                -- Supabase Storage URL（オプション）
  insights JSONB NOT NULL,       -- { keywords, insights, question }
  entry_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)   -- 1日1エントリ制約
);

CREATE INDEX IF NOT EXISTS entries_user_date_idx ON entries (user_id, entry_date DESC);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entries: own data only" ON entries
  FOR ALL USING (auth.uid() = user_id);

-- ─── Echoレターテーブル ─────────────────────────────

CREATE TABLE IF NOT EXISTS letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  week_start DATE NOT NULL,      -- その週の月曜日
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS letters_user_idx ON letters (user_id, week_start DESC);

ALTER TABLE letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "letters: own data only" ON letters
  FOR ALL USING (auth.uid() = user_id);

-- ─── Supabase Storageバケット ─────────────────────────

-- 音声ファイル保存用バケット（30日後に自動削除はライフサイクルルールで設定）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  FALSE,
  52428800, -- 50MB上限
  ARRAY['audio/m4a', 'audio/mp4', 'audio/mpeg']
) ON CONFLICT (id) DO NOTHING;

-- RLS: 自分の音声ファイルのみアクセス可
CREATE POLICY "audio: own files only" ON storage.objects
  FOR ALL USING (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── ユーザー自動作成トリガー ─────────────────────────

-- Supabase Authにユーザーが作成されたとき、usersテーブルにも自動挿入
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, apple_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'sub'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── updated_atの自動更新 ───────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
