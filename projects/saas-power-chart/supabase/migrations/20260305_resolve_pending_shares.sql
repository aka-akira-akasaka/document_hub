-- ============================================
-- deal_shares: ペンディング招待の自己解決ポリシー
-- ログインユーザーが自分のメールに紐づく未解決招待を解決できるようにする
-- ============================================

-- 共有先ユーザーが自分のペンディング招待を解決（shared_with_user_id を設定）可能にする
create policy "deal_shares_resolve_pending" on public.deal_shares
  for update using (
    shared_with_user_id is null
    and shared_with_email = (auth.jwt() ->> 'email')
  ) with check (
    shared_with_user_id = auth.uid()
  );
