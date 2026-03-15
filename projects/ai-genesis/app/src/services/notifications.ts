import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// 通知ハンドラの設定（フォアグラウンドでも通知を表示）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

// ─── 権限・トークン ─────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // シミュレータでは不可

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.warn('EAS projectId が未設定です。app.json の extra.eas.projectId を設定してください。');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

/**
 * プッシュトークンをSupabaseに保存する
 * （将来的にサーバーサイドからの通知送信に使用）
 */
export async function savePushToken(userId: string): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;

  await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);
}

// ─── ローカル通知スケジューリング ────────────────────────

/**
 * 毎日のリマインダー通知をスケジュールする
 * @param hour 通知時刻（0〜23）
 */
export async function scheduleDailyReminder(hour: number): Promise<void> {
  // 既存の日次リマインダーをキャンセル
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title: '今日の記録、忘れずに 🎙️',
      body: '今日はどんな一日でしたか？話すだけでOKです。',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('daily-reminder');
}

/**
 * 週次Echoレターの到着通知（日曜朝7時）
 */
export async function scheduleWeeklyLetterNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('weekly-letter');

  await Notifications.scheduleNotificationAsync({
    identifier: 'weekly-letter',
    content: {
      title: '今週のEchoレターが届きました ✉️',
      body: 'あなただけへのメッセージを読んでみてください。',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 日曜日 (expo-notificationsでは1=日)
      hour: 7,
      minute: 0,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── バッジ管理 ──────────────────────────────────────────

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
