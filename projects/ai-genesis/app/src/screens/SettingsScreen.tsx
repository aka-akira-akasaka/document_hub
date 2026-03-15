import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../hooks/useAuth';
import { restorePurchases } from '../services/revenuecat';
import { updateSubscriptionStatus, updateNotificationHour } from '../services/supabase';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
  requestNotificationPermission,
} from '../services/notifications';
import { colors, spacing, typography, radius } from '../config/theme';
import type { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const NOTIFICATION_HOURS = [7, 8, 9, 12, 18, 20, 21, 22];

export default function SettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, signOut, refreshSubscription } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedHour, setSelectedHour] = useState(user?.notificationHour ?? 8);

  useEffect(() => {
    void checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
        await scheduleDailyReminder(selectedHour);
      } else {
        Alert.alert(
          '通知が許可されていません',
          '設定アプリからEchoの通知を有効にしてください。',
        );
      }
    } else {
      setNotificationsEnabled(false);
      await cancelDailyReminder();
    }
  };

  const handleHourChange = async (hour: number) => {
    setSelectedHour(hour);
    if (notificationsEnabled && user) {
      await scheduleDailyReminder(hour);
      await updateNotificationHour(user.id, hour);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'サインアウト',
      'サインアウトしますか？データはクラウドに保存されています。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'サインアウト',
          style: 'destructive',
          onPress: () => void signOut(),
        },
      ],
    );
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const status = await restorePurchases();
      if (user) {
        await updateSubscriptionStatus(user.id, status);
        await refreshSubscription();
      }
      Alert.alert(
        status === 'pro' ? '復元完了' : '購入履歴なし',
        status === 'pro'
          ? 'Proプランが復元されました。'
          : '購入済みの項目が見つかりませんでした。',
      );
    } catch {
      Alert.alert('エラー', '購入の復元に失敗しました。');
    } finally {
      setIsRestoring(false);
    }
  };

  const isPro = user?.subscriptionStatus === 'pro';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 通知設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>通知</Text>
          <View style={styles.card}>
            <View style={[styles.settingRow, { borderBottomWidth: notificationsEnabled ? 1 : 0 }]}>
              <Text style={styles.settingLabel}>毎日のリマインダー</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.bgCardAlt, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
            {notificationsEnabled && (
              <View style={styles.hourSelector}>
                <Text style={styles.hourSelectorLabel}>通知時刻</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hourList}
                >
                  {NOTIFICATION_HOURS.map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.hourBtn,
                        selectedHour === h && styles.hourBtnSelected,
                      ]}
                      onPress={() => handleHourChange(h)}
                    >
                      <Text style={[
                        styles.hourBtnText,
                        selectedHour === h && styles.hourBtnTextSelected,
                      ]}>
                        {h}時
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* プラン情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>プラン</Text>
          <View style={styles.planCard}>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>
                {isPro ? '✨ Echo Pro' : '無料プラン'}
              </Text>
              <Text style={styles.planDesc}>
                {isPro
                  ? '無制限録音・Echoレター・全履歴'
                  : '1日1回録音・直近7件表示'}
              </Text>
            </View>
            {!isPro && (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => navigation.navigate('Paywall', { trigger: 'feature' })}
              >
                <Text style={styles.upgradeBtnText}>アップグレード</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* アカウント */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>アカウント</Text>
          <View style={styles.card}>
            <SettingRow
              label="Apple ID"
              value={user?.email ?? '非公開'}
            />
          </View>
        </View>

        {/* サポート */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>サポート</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleRestorePurchases}
              disabled={isRestoring}
            >
              <Text style={styles.settingLabel}>
                {isRestoring ? '確認中...' : '購入を復元'}
              </Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>情報</Text>
          <View style={styles.card}>
            <SettingRow label="バージョン" value="1.0.0" />
            <SettingRow label="ビルド者" value="AI Genesis (Claude)" />
          </View>
        </View>

        {/* サインアウト */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>サインアウト</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Echo は AI Genesis によって作られました。{'\n'}
          このアプリはAIが自律的に設計・開発しました。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.text },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  planCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: { gap: spacing.xs },
  planName: { ...typography.body, color: colors.text, fontWeight: '600' },
  planDesc: { ...typography.caption, color: colors.textSecondary },
  upgradeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  upgradeBtnText: { ...typography.caption, color: colors.text, fontWeight: '700' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: { ...typography.body, color: colors.text },
  settingValue: { ...typography.body, color: colors.textSecondary },
  settingArrow: { ...typography.h3, color: colors.textMuted },
  hourSelector: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  hourSelectorLabel: { ...typography.caption, color: colors.textMuted },
  hourList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hourBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCardAlt,
  },
  hourBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hourBtnText: { ...typography.caption, color: colors.textSecondary },
  hourBtnTextSelected: { color: colors.text, fontWeight: '700' },
  signOutBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  signOutText: { ...typography.body, color: colors.error, fontWeight: '600' },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
