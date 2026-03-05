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

-- オーナーは自分の案件の共有を全操作可能
create policy "deal_shares_owner_all" on public.deal_shares
  for all using (auth.uid() = owner_id);

-- 共有されたユーザーは自分の共有レコードを閲覧可能
create policy "deal_shares_shared_select" on public.deal_shares
  for select using (auth.uid() = shared_with_user_id);

-- ============================================
-- deals: RLSポリシー更新（共有ユーザーのアクセス許可）
-- ============================================

drop policy if exists "deals_select" on public.deals;
drop policy if exists "deals_insert" on public.deals;
drop policy if exists "deals_update" on public.deals;
drop policy if exists "deals_delete" on public.deals;

create policy "deals_select" on public.deals for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.deal_shares
    where deal_shares.deal_id = deals.id
      and deal_shares.shared_with_user_id = auth.uid()
  )
);

create policy "deals_insert" on public.deals
  for insert with check (auth.uid() = user_id);

create policy "deals_update" on public.deals for update using (
  auth.uid() = user_id
  or exists (
    select 1 from public.deal_shares
    where deal_shares.deal_id = deals.id
      and deal_shares.shared_with_user_id = auth.uid()
      and deal_shares.role = 'editor'
  )
);

create policy "deals_delete" on public.deals
  for delete using (auth.uid() = user_id);

-- ============================================
-- stakeholders: RLSポリシー更新
-- ============================================

drop policy if exists "stakeholders_all" on public.stakeholders;

create policy "stakeholders_select" on public.stakeholders for select using (
  exists (
    select 1 from public.deals
    where deals.id = stakeholders.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
        )
      )
  )
);

create policy "stakeholders_modify" on public.stakeholders
  for insert with check (
    exists (
      select 1 from public.deals
      where deals.id = stakeholders.deal_id
        and (
          deals.user_id = auth.uid()
          or exists (
            select 1 from public.deal_shares
            where deal_shares.deal_id = deals.id
              and deal_shares.shared_with_user_id = auth.uid()
              and deal_shares.role = 'editor'
          )
        )
    )
  );

create policy "stakeholders_update" on public.stakeholders for update using (
  exists (
    select 1 from public.deals
    where deals.id = stakeholders.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
            and deal_shares.role = 'editor'
        )
      )
  )
);

create policy "stakeholders_delete" on public.stakeholders for delete using (
  exists (
    select 1 from public.deals
    where deals.id = stakeholders.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
            and deal_shares.role = 'editor'
        )
      )
  )
);

-- ============================================
-- relationships: RLSポリシー更新
-- ============================================

drop policy if exists "relationships_all" on public.relationships;

create policy "relationships_select" on public.relationships for select using (
  exists (
    select 1 from public.deals
    where deals.id = relationships.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
        )
      )
  )
);

create policy "relationships_modify" on public.relationships
  for insert with check (
    exists (
      select 1 from public.deals
      where deals.id = relationships.deal_id
        and (
          deals.user_id = auth.uid()
          or exists (
            select 1 from public.deal_shares
            where deal_shares.deal_id = deals.id
              and deal_shares.shared_with_user_id = auth.uid()
              and deal_shares.role = 'editor'
          )
        )
    )
  );

create policy "relationships_update" on public.relationships for update using (
  exists (
    select 1 from public.deals
    where deals.id = relationships.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
            and deal_shares.role = 'editor'
        )
      )
  )
);

create policy "relationships_delete" on public.relationships for delete using (
  exists (
    select 1 from public.deals
    where deals.id = relationships.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
            and deal_shares.role = 'editor'
        )
      )
  )
);

-- ============================================
-- org_groups: RLSポリシー更新
-- ============================================

drop policy if exists "org_groups_all" on public.org_groups;

create policy "org_groups_select" on public.org_groups for select using (
  exists (
    select 1 from public.deals
    where deals.id = org_groups.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
        )
      )
  )
);

create policy "org_groups_modify" on public.org_groups
  for insert with check (
    exists (
      select 1 from public.deals
      where deals.id = org_groups.deal_id
        and (
          deals.user_id = auth.uid()
          or exists (
            select 1 from public.deal_shares
            where deal_shares.deal_id = deals.id
              and deal_shares.shared_with_user_id = auth.uid()
              and deal_shares.role = 'editor'
          )
        )
    )
  );

create policy "org_groups_update" on public.org_groups for update using (
  exists (
    select 1 from public.deals
    where deals.id = org_groups.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
            and deal_shares.role = 'editor'
        )
      )
  )
);

create policy "org_groups_delete" on public.org_groups for delete using (
  exists (
    select 1 from public.deals
    where deals.id = org_groups.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
            and deal_shares.role = 'editor'
        )
      )
  )
);

-- ============================================
-- org_level_configs: RLSポリシー更新
-- ============================================

drop policy if exists "org_level_configs_all" on public.org_level_configs;

create policy "org_level_configs_select" on public.org_level_configs for select using (
  exists (
    select 1 from public.deals
    where deals.id = org_level_configs.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
        )
      )
  )
);

create policy "org_level_configs_modify" on public.org_level_configs
  for insert with check (
    exists (
      select 1 from public.deals
      where deals.id = org_level_configs.deal_id
        and (
          deals.user_id = auth.uid()
          or exists (
            select 1 from public.deal_shares
            where deal_shares.deal_id = deals.id
              and deal_shares.shared_with_user_id = auth.uid()
              and deal_shares.role = 'editor'
          )
        )
    )
  );

create policy "org_level_configs_update" on public.org_level_configs for update using (
  exists (
    select 1 from public.deals
    where deals.id = org_level_configs.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
            and deal_shares.role = 'editor'
        )
      )
  )
);

create policy "org_level_configs_delete" on public.org_level_configs for delete using (
  exists (
    select 1 from public.deals
    where deals.id = org_level_configs.deal_id
      and (
        deals.user_id = auth.uid()
        or exists (
          select 1 from public.deal_shares
          where deal_shares.deal_id = deals.id
            and deal_shares.shared_with_user_id = auth.uid()
            and deal_shares.role = 'editor'
        )
      )
  )
);

-- ============================================
-- メール解決トリガー: ユーザー作成時に未解決の共有招待を自動解決
-- ============================================

create or replace function public.resolve_deal_shares_on_signup()
returns trigger as $$
begin
  update public.deal_shares
  set shared_with_user_id = new.id, updated_at = now()
  where shared_with_email = new.email
    and shared_with_user_id is null;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.resolve_deal_shares_on_signup();
