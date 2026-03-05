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

-- オーナー＋共有ユーザーが閲覧可能
create policy "tier_configs_select" on public.tier_configs for select using (
  exists (
    select 1 from public.deals
    where deals.id = tier_configs.deal_id
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

-- オーナー＋editor権限の共有ユーザーが変更可能
create policy "tier_configs_modify" on public.tier_configs
  for insert with check (
    exists (
      select 1 from public.deals
      where deals.id = tier_configs.deal_id
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

create policy "tier_configs_update" on public.tier_configs for update using (
  exists (
    select 1 from public.deals
    where deals.id = tier_configs.deal_id
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

create policy "tier_configs_delete" on public.tier_configs for delete using (
  exists (
    select 1 from public.deals
    where deals.id = tier_configs.deal_id
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
