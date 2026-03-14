import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import type { PurchasesPackage } from 'react-native-purchases';
import { useAuth } from '../hooks/useAuth';
import { getOfferings, purchasePackage, restorePurchases } from '../services/revenuecat';
import { updateSubscriptionStatus } from '../services/supabase';
import { colors, spacing, typography, radius } from '../config/theme';
import type { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'Paywall'>;

const PRO_FEATURES = [
  { icon: '🎙️', text: '毎日何度でも録音できる' },
  { icon: '📖', text: '過去の記録すべてを見返せる' },
  { icon: '✉️', text: '毎週日曜にEchoレターが届く' },
  { icon: '📊', text: '感情トレンドの分析（近日公開）' },
];

export default function PaywallScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RouteType>();
  const { user, refreshSubscription } = useAuth();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    void loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const pkgs = await getOfferings();
      setPackages(pkgs);
      // 年額プランをデフォルト選択
      const annual = pkgs.find(p => p.identifier.includes('annual'));
      setSelectedPackage(annual ?? pkgs[0] ?? null);
    } catch {
      // オフライン時はスキップ
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;
    setIsPurchasing(true);
    try {
      await purchasePackage(selectedPackage);
      await updateSubscriptionStatus(user.id, 'pro');
      await refreshSubscription();
      Alert.alert('ありがとうございます！', 'Echo Proへようこそ。', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: unknown) {
      if ((error as { userCancelled?: boolean }).userCancelled) return;
      Alert.alert('購入エラー', 'もう一度お試しください。');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const status = await restorePurchases();
      if (user) {
        await updateSubscriptionStatus(user.id, status);
        await refreshSubscription();
      }
      if (status === 'pro') {
        Alert.alert('復元完了', 'Proプランが復元されました。', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('購入履歴なし', '復元できる購入履歴が見つかりませんでした。');
      }
    } catch {
      Alert.alert('エラー', '購入の復元に失敗しました。');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>✨</Text>
          <Text style={styles.heroTitle}>Echo Pro</Text>
          <Text style={styles.heroSub}>
            {params.trigger === 'limit'
              ? '今日の上限に達しました。Proにアップグレードしてください。'
              : 'AIとより深く、より長く。'}
          </Text>
        </View>

        {/* 機能一覧 */}
        <View style={styles.features}>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* プラン選択 */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <View style={styles.plans}>
            {packages.map(pkg => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.planCard,
                  selectedPackage?.identifier === pkg.identifier && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPackage(pkg)}
              >
                <View style={styles.planCardLeft}>
                  <Text style={styles.planTitle}>
                    {pkg.identifier.includes('annual') ? '年額プラン' : '月額プラン'}
                  </Text>
                  {pkg.identifier.includes('annual') && (
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>お得</Text>
                      </View>
                      <Text style={styles.savingsText}>2ヶ月分無料相当</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planPrice}>
                  {pkg.product.priceString}
                  <Text style={styles.planPeriod}>
                    {pkg.identifier.includes('annual') ? '/年' : '/月'}
                  </Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 購入ボタン */}
        <TouchableOpacity
          style={[styles.purchaseBtn, isPurchasing && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || !selectedPackage}
        >
          {isPurchasing ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.purchaseBtnText}>今すぐ始める</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
          <Text style={styles.restoreText}>購入を復元</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          サブスクリプションは自動更新されます。キャンセルはApp Storeの設定から行えます。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
  },
  closeBtnText: { color: colors.textSecondary, fontSize: 16 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
    alignItems: 'center',
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  heroIcon: { fontSize: 56 },
  heroTitle: { ...typography.h1, color: colors.text, fontSize: 34 },
  heroSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    width: '100%',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  featureText: { ...typography.body, color: colors.text, flex: 1 },
  plans: { width: '100%', gap: spacing.md },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: { borderColor: colors.primary },
  planCardLeft: { gap: spacing.xs },
  planTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { ...typography.caption, color: colors.text, fontWeight: '700' },
  savingsText: { ...typography.caption, color: colors.primaryLight },
  planPrice: { ...typography.h2, color: colors.text },
  planPeriod: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '400' },
  purchaseBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  purchaseBtnDisabled: { opacity: 0.6 },
  purchaseBtnText: { ...typography.body, color: colors.text, fontWeight: '700', fontSize: 18 },
  restoreText: { ...typography.bodySmall, color: colors.textMuted },
  legalText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
