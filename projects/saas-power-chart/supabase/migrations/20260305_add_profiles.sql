-- ============================================
-- profiles テーブル: ユーザープロフィール管理
-- 共有ダイアログでのサジェスト表示に使用
-- ============================================

begin;

-- 1. テーブル作成
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_email on public.profiles(email);

alter table public.profiles enable row level security;

-- 2. RLS ポリシー
-- 自分自身 OR 同一メールドメインのプロフィールのみ閲覧可能
-- （フリードメインのブロックはアプリ層で実施）
create policy "profiles_select_same_domain" on public.profiles
  for select using (
    auth.uid() = id
    or split_part(email, '@', 2) = split_part(auth.jwt() ->> 'email', '@', 2)
  );

-- 自分のプロフィールのみ更新可能
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 3. ユーザー登録・更新時の自動同期トリガー
create or replace function public.sync_profile_on_auth_change()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict(id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_sync_profile
  after insert or update on auth.users
  for each row execute function public.sync_profile_on_auth_change();

-- 4. 既存ユーザーのバックフィル
insert into public.profiles (id, email, full_name, avatar_url)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data->>'full_name', ''),
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict(id) do nothing;

commit;
