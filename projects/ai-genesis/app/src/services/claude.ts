import Constants from 'expo-constants';
import type { EntryInsights } from '../types';

const ANTHROPIC_API_KEY = Constants.expoConfig?.extra?.anthropicApiKey as string;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

async function callClaude(
  model: string,
  system: string,
  userMessage: string,
  maxTokens = 1024,
): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API エラー: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content[0]?.text ?? '';
}

/**
 * 音声テキストからAIインサイトを生成する（Claude Haiku）
 */
export async function generateInsights(
  transcription: string,
  recentKeywords: string[],
): Promise<EntryInsights> {
  const system = `あなたはユーザーの音声日記を聴いて、温かく知的な観察を返すコーチです。
批判や評価はしません。ただ観察します。「すべき」「もっと〜すれば」は使いません。
日本語で、自然な話し言葉で書いてください。

以下のJSON形式のみで回答してください（コードブロックは不要）:
{
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "insights": ["気づき1", "気づき2", "気づき3"],
  "question": "来明日への1つの問い"
}`;

  const userMessage = `音声テキスト:
${transcription}

直近7日間のキーワード（参考）:
${recentKeywords.length > 0 ? recentKeywords.join('、') : '（初回）'}`;

  const raw = await callClaude(HAIKU_MODEL, system, userMessage, 512);

  // JSONパース（前後の不要なテキストを除去）
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('インサイトのJSON形式が不正です');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    keywords: unknown;
    insights: unknown;
    question: unknown;
  };

  // バリデーション
  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 3) as string[] : [];
  const insights = Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) as string[] : [];
  const question = typeof parsed.question === 'string' ? parsed.question : '';

  return { keywords, insights, question };
}

/**
 * 週次Echoレターを生成する（Claude Haiku）
 */
export async function generateWeeklyLetter(
  weeklyTranscriptions: Array<{ date: string; text: string }>,
): Promise<string> {
  const system = `あなたは温かく知的な観察者として、ユーザーの週次振り返りレターを書きます。

形式:
- 800〜1200文字の日本語文章
- 「あなたへ」で始める
- パターン・傾向・変化を指摘する（批判しない）
- 来週への1つの問いで締める
- 主観的な解釈を避け、事実に基づく観察を主とする
- 読む人が「見てもらえた」と感じる文章にする`;

  const entriesText = weeklyTranscriptions
    .map(e => `【${e.date}】\n${e.text}`)
    .join('\n\n');

  const userMessage = `今週の音声ログ（文字起こし済み）:\n\n${entriesText}`;

  return callClaude(HAIKU_MODEL, system, userMessage, 1500);
}
