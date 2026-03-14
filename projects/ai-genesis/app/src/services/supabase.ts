import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import type { Entry, EntryInsights, Letter, User } from '../types';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── 認証 ───────────────────────────────────────────

export async function signInWithApple(identityToken: string, fullName?: string | null) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
    nonce: undefined,
  });
  if (error) throw error;

  // プロフィール保存（初回のみ）
  if (data.user && fullName) {
    await supabase.from('users').upsert({
      id: data.user.id,
      apple_id: data.user.user_metadata?.sub,
      email: data.user.email,
      display_name: fullName,
    }, { onConflict: 'id', ignoreDuplicates: true });
  }

  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

// ─── エントリ ───────────────────────────────────────

export async function createEntry(
  userId: string,
  transcription: string,
  insights: EntryInsights,
  entryDate: string,
): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      transcription,
      insights,
      entry_date: entryDate,
    })
    .select()
    .single();

  if (error) throw error;
  return mapEntry(data);
}

export async function getEntries(userId: string, limit = 30): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapEntry);
}

export async function getTodayEntry(userId: string): Promise<Entry | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', today)
    .single();

  return data ? mapEntry(data) : null;
}

export async function getEntryById(entryId: string): Promise<Entry | null> {
  const { data } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .single();

  return data ? mapEntry(data) : null;
}

// 直近7日のキーワードを取得（デイリープロンプト生成に使用）
export async function getRecentKeywords(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('entries')
    .select('insights')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(7);

  if (!data) return [];
  return data.flatMap((e: { insights: EntryInsights }) => e.insights?.keywords ?? []);
}

// ─── Echoレター ────────────────────────────────────

export async function getLetters(userId: string): Promise<Letter[]> {
  const { data, error } = await supabase
    .from('letters')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapLetter);
}

export async function markLetterAsRead(letterId: string): Promise<void> {
  await supabase
    .from('letters')
    .update({ is_read: true })
    .eq('id', letterId);
}

export async function getUnreadLetterCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('letters')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return count ?? 0;
}

// ─── ユーザー設定 ────────────────────────────────────

export async function updateNotificationHour(userId: string, hour: number): Promise<void> {
  await supabase
    .from('users')
    .update({ notification_hour: hour })
    .eq('id', userId);
}

export async function updateSubscriptionStatus(
  userId: string,
  status: 'free' | 'pro',
): Promise<void> {
  await supabase
    .from('users')
    .update({ subscription_status: status })
    .eq('id', userId);
}

// ─── ストリーク計算 ──────────────────────────────────

export async function getStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from('entries')
    .select('entry_date')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(365);

  if (!data || data.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);

    if (data[i].entry_date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ─── マッパー ─────────────────────────────────────────

function mapEntry(row: Record<string, unknown>): Entry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    transcription: row.transcription as string,
    audioUrl: row.audio_url as string | undefined,
    entryDate: row.entry_date as string,
    insights: row.insights as EntryInsights,
    createdAt: row.created_at as string,
  };
}

function mapLetter(row: Record<string, unknown>): Letter {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    content: row.content as string,
    weekStart: row.week_start as string,
    generatedAt: row.generated_at as string,
    isRead: row.is_read as boolean,
  };
}
