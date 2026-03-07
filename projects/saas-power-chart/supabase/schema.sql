-- Power Chart: Supabase スキーマ定義
-- RLS (Row Level Security) で各ユーザーのデータを分離

-- UUID拡張を有効化
create extension if not exists "uuid-ossp";

-- ============================================
-- deals: 案件テーブル
-- ============================================
create table public.deals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_name text not null,
  stage text not null default 'prospecting',
  description text not null default '',
  target_amount numeric,
  expected_close_date text,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_deals_user_id on public.deals(user_id);

alter table public.deals enable row level security;

create policy "deals_select" on public.deals
  for select using (auth.uid() = user_id);
create policy "deals_insert" on public.deals
  for insert with check (auth.uid() = user_id);
create policy "deals_update" on public.deals
  for update using (auth.uid() = user_id);
create policy "deals_delete" on public.deals
  for delete using (auth.uid() = user_id);

-- ============================================
-- stakeholders: ステークホルダーテーブル
-- ============================================
create table public.stakeholders (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  name text not null,
  department text not null default '',
  title text not null default '',
  role_in_deal text not null default 'unknown',
  influence_level integer not null default 3,
  attitude text not null default 'neutral',
  mission text not null default '',
  relationship_owner text not null default '',
  parent_id text,
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  org_level integer not null default 1,
  group_id text,
  sort_order integer not null default 0,
  position_x numeric,
  position_y numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_stakeholders_deal_id on public.stakeholders(deal_id);

alter table public.stakeholders enable row level security;

create policy "stakeholders_all" on public.stakeholders
  for all using (
    exists (
      select 1 from public.deals
      where deals.id = stakeholders.deal_id
        and deals.user_id = auth.uid()
    )
  );

-- ============================================
-- relationships: 関係線テーブル
-- ============================================
create table public.relationships (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  source_id text not null,
  target_id text not null,
  type text not null default 'reporting',
  label text,
  bidirectional boolean not null default false,
  direction text,
  color text,
  target_type text default 'stakeholder',
  source_type text default 'stakeholder',
  source_handle text,
  target_handle text,
  created_at timestamptz not null default now()
);

create index idx_relationships_deal_id on public.relationships(deal_id);

alter table public.relationships enable row level security;

create policy "relationships_all" on public.relationships
  for all using (
    exists (
      select 1 from public.deals
      where deals.id = relationships.deal_id
        and deals.user_id = auth.uid()
    )
  );

-- ============================================
-- org_groups: 組織グループ（部署）テーブル
-- ============================================
create table public.org_groups (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  name text not null,
  parent_group_id text,
  color text,
  sort_order integer not null default 0,
  tier integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_org_groups_deal_id on public.org_groups(deal_id);

alter table public.org_groups enable row level security;

create policy "org_groups_all" on public.org_groups
  for all using (
    exists (
      select 1 from public.deals
      where deals.id = org_groups.deal_id
        and deals.user_id = auth.uid()
    )
  );

-- ============================================
-- org_level_configs: 階層定義テーブル
-- ============================================
create table public.org_level_configs (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  level integer not null,
  label text not null,
  constraint unique_deal_level unique (deal_id, level)
);

create index idx_org_level_configs_deal_id on public.org_level_configs(deal_id);

alter table public.org_level_configs enable row level security;

create policy "org_level_configs_all" on public.org_level_configs
  for all using (
    exists (
      select 1 from public.deals
      where deals.id = org_level_configs.deal_id
        and deals.user_id = auth.uid()
    )
  );

-- ============================================
-- tier_configs: 部署種別定義テーブル
-- ============================================
create table public.tier_configs (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  tier integer not null,
  label text not null,
  constraint unique_deal_tier unique (deal_id, tier)
);

create index idx_tier_configs_deal_id on public.tier_configs(deal_id);

alter table public.tier_configs enable row level security;

create policy "tier_configs_all" on public.tier_configs
  for all using (
    exists (
      select 1 from public.deals
      where deals.id = tier_configs.deal_id
        and deals.user_id = auth.uid()
    )
  );

-- ============================================
-- deal_shares: 案件共有テーブル
-- ============================================
create table public.deal_shares (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with_email text not null,
  shared_with_user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_deal_share unique (deal_id, shared_with_email)
);

create index idx_deal_shares_deal_id on public.deal_shares(deal_id);
create index idx_deal_shares_user_id on public.deal_shares(shared_with_user_id);
create index idx_deal_shares_email on public.deal_shares(shared_with_email);

alter table public.deal_shares enable row level security;

create policy "deal_shares_owner_all" on public.deal_shares
  for all using (auth.uid() = owner_id);

create policy "deal_shares_shared_select" on public.deal_shares
  for select using (auth.uid() = shared_with_user_id);
