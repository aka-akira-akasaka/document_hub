-- ============================================
-- deal_shares: shared_with_user_id の自動解決トリガー
-- INSERT/UPDATE 時に auth.users から自動的にユーザーIDを解決する
-- ============================================

-- 既存のペンディング解決ポリシーは不要になるが、残しても害はない

create or replace function public.resolve_share_user_id()
returns trigger as $$
begin
  -- auth.users から email でユーザーIDを解決（SECURITY DEFINER で RLS をバイパス）
  select id into new.shared_with_user_id
  from auth.users
  where email = new.shared_with_email
  limit 1;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_deal_share_resolve_user
  before insert or update on public.deal_shares
  for each row execute function public.resolve_share_user_id();

-- 既存のNULLレコードを修正
update public.deal_shares ds
set shared_with_user_id = u.id
from auth.users u
where ds.shared_with_email = u.email
  and ds.shared_with_user_id is null;
