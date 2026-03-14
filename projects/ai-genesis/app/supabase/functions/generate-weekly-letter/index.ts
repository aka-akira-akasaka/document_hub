/**
 * Supabase Edge Function: generate-weekly-letter
 *
 * 役割: 毎週日曜日にCron Jobとして実行され、
 *       Proユーザー全員の週次Echoレターを生成する
 *
 * 実行タイミング: 毎週日曜 07:00 JST (日曜 22:00 UTC / 土曜 22:00 UTC)
 * Supabase Cron設定: 0 22 * * 0
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// 今週の月曜日を取得（YYYY-MM-DD）
function getThisMonday(): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=日, 1=月, ..., 6=土
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

// 指定期間のエントリを取得
async function getWeeklyEntries(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  weekStart: string,
): Promise<Array<{ date: string; text: string }>> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const { data } = await supabase
    .from('entries')
    .select('entry_date, transcription')
    .eq('user_id', userId)
    .gte('entry_date', weekStart)
    .lte('entry_date', weekEndStr)
    .order('entry_date', { ascending: true });

  return (data ?? []).map((e: { entry_date: string; transcription: string }) => ({
    date: e.entry_date,
    text: e.transcription,
  }));
}

// Claude Haiku でレターを生成
async function generateLetter(entries: Array<{ date: string; text: string }>): Promise<string> {
  const entriesText = entries
    .map(e => `【${e.date}】\n${e.text}`)
    .join('\n\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: `あなたは温かく知的な観察者として、ユーザーの週次振り返りレターを書きます。

形式:
- 800〜1200文字の日本語文章
- 「あなたへ」で始める
- パターン・傾向・変化を指摘する（批判しない）
- 来週への1つの問いで締める
- 主観的な解釈を避け、事実に基づく観察を主とする
- 読む人が「見てもらえた」と感じる文章にする`,
      messages: [{
        role: 'user',
        content: `今週の音声ログ（文字起こし済み）:\n\n${entriesText}`,
      }],
    }),
  });

  if (!res.ok) throw new Error(`Claude エラー: ${await res.text()}`);
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content[0]?.text ?? '';
}

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const weekStart = getThisMonday();

  console.log(`Echoレター生成開始: 週開始=${weekStart}`);

  // Proユーザー全員を取得
  const { data: proUsers, error } = await supabase
    .from('users')
    .select('id')
    .eq('subscription_status', 'pro');

  if (error) {
    console.error('ユーザー取得エラー:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const user of proUsers ?? []) {
    try {
      // 既にこの週のレターが存在する場合はスキップ
      const { data: existing } = await supabase
        .from('letters')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      if (existing) {
        skipCount++;
        continue;
      }

      // 今週のエントリを取得
      const entries = await getWeeklyEntries(supabase, user.id, weekStart);

      if (entries.length < 3) {
        // 3日未満の場合はレターを生成しない
        skipCount++;
        continue;
      }

      // レターを生成
      const content = await generateLetter(entries);

      // DBに保存
      await supabase.from('letters').insert({
        user_id: user.id,
        content,
        week_start: weekStart,
      });

      successCount++;
      console.log(`レター生成成功: userId=${user.id}`);

      // API制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      errorCount++;
      console.error(`レター生成エラー: userId=${user.id}`, err);
    }
  }

  const result = {
    weekStart,
    total: (proUsers ?? []).length,
    success: successCount,
    skipped: skipCount,
    errors: errorCount,
  };

  console.log('Echoレター生成完了:', result);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
