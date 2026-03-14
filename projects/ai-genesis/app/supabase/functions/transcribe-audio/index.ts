/**
 * Supabase Edge Function: transcribe-audio
 *
 * 役割: 音声ファイルをOpenAI Whisper APIで文字起こしし、
 *       Claude HaikuでAIインサイトを生成してDBに保存する
 *
 * 呼び出し: クライアントアプリから直接呼び出す
 * POST /functions/v1/transcribe-audio
 * Body: { audio_base64: string, entry_date: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // JWTからユーザーIDを取得
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('認証が必要です');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } =
      await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('認証エラー');

    const { audio_base64, entry_date } = await req.json() as {
      audio_base64: string;
      entry_date: string;
    };

    // ─── Step 1: Whisper API で文字起こし ───────────────────

    const audioBytes = Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0));
    const formData = new FormData();
    const audioBlob = new Blob([audioBytes], { type: 'audio/m4a' });
    formData.append('file', audioBlob, 'recording.m4a');
    formData.append('model', 'whisper-1');
    formData.append('language', 'ja');
    formData.append('response_format', 'text');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperRes.ok) throw new Error(`Whisper エラー: ${await whisperRes.text()}`);
    const transcription = (await whisperRes.text()).trim();

    if (!transcription || transcription.length < 5) {
      return new Response(
        JSON.stringify({ error: '音声を聞き取れませんでした' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ─── Step 2: 直近7日のキーワード取得 ───────────────────

    const { data: recentEntries } = await supabase
      .from('entries')
      .select('insights')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(7);

    const recentKeywords: string[] = (recentEntries ?? [])
      .flatMap((e: { insights: { keywords?: string[] } }) => e.insights?.keywords ?? []);

    // ─── Step 3: Claude Haiku でインサイト生成 ────────────────

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: `あなたはユーザーの音声日記を聴いて、温かく知的な観察を返すコーチです。
批判や評価はしません。ただ観察します。「すべき」は使いません。
日本語で自然な話し言葉で書いてください。

以下のJSON形式のみで回答してください:
{
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "insights": ["気づき1", "気づき2", "気づき3"],
  "question": "明日への1つの問い"
}`,
        messages: [{
          role: 'user',
          content: `音声テキスト:\n${transcription}\n\n直近7日のキーワード: ${
            recentKeywords.length > 0 ? recentKeywords.join('、') : '（初回）'
          }`,
        }],
      }),
    });

    if (!claudeRes.ok) throw new Error(`Claude エラー: ${await claudeRes.text()}`);

    const claudeData = await claudeRes.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const rawText = claudeData.content[0]?.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('インサイトのJSON解析に失敗');

    const insights = JSON.parse(jsonMatch[0]);

    // ─── Step 4: DBに保存 ────────────────────────────────────

    const { data: entry, error: insertError } = await supabase
      .from('entries')
      .insert({
        user_id: user.id,
        transcription,
        insights,
        entry_date,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ entry, transcription, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'エラーが発生しました';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
