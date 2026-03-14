import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { getEntries } from '../services/supabase';
import { colors, spacing, typography, radius } from '../config/theme';
import type { Entry, RootStackParamList } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function TimelineScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    // 無料ユーザーは直近7件のみ
    const limit = user.subscriptionStatus === 'pro' ? 365 : 7;
    const data = await getEntries(user.id, limit);
    setEntries(data);
  }, [user]);

  useEffect(() => {
    void loadEntries().finally(() => setIsLoading(false));
  }, [loadEntries]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadEntries();
    setIsRefreshing(false);
  }, [loadEntries]);

  const handleEntryPress = (entry: Entry) => {
    navigation.navigate('Insight', { entryId: entry.id });
  };

  const handleUpgradePress = () => {
    navigation.navigate('Paywall', { trigger: 'feature' });
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>記録</Text>
        {user?.subscriptionStatus === 'free' && (
          <Text style={styles.subtitle}>直近7件を表示</Text>
        )}
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EntryCard entry={item} onPress={() => handleEntryPress(item)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎙️</Text>
            <Text style={styles.emptyText}>まだ記録がありません</Text>
            <Text style={styles.emptySubText}>ホームでマイクをタップして話してみましょう</Text>
          </View>
        }
        ListFooterComponent={
          user?.subscriptionStatus === 'free' && entries.length >= 7 ? (
            <TouchableOpacity style={styles.upgradeBanner} onPress={handleUpgradePress}>
              <Text style={styles.upgradeBannerText}>🔓 Proにアップグレードして全履歴を見る</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function EntryCard({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const dateLabel = format(new Date(entry.entryDate + 'T00:00:00'), 'M月d日 EEE', { locale: ja });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{dateLabel}</Text>
        <View style={styles.cardKeywords}>
          {entry.insights.keywords.slice(0, 2).map((kw, i) => (
            <Text key={i} style={styles.cardKeyword}>#{kw}</Text>
          ))}
        </View>
      </View>

      <Text style={styles.cardInsight} numberOfLines={2}>
        {entry.insights.insights[0] ?? entry.transcription}
      </Text>

      <Text style={styles.cardQuestion} numberOfLines={1}>
        Q: {entry.insights.question}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    ...typography.label,
    color: colors.textSecondary,
  },
  cardKeywords: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cardKeyword: {
    ...typography.caption,
    color: colors.primaryLight,
  },
  cardInsight: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  cardQuestion: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptySubText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  upgradeBanner: {
    backgroundColor: colors.primaryDim,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  upgradeBannerText: {
    ...typography.body,
    color: colors.primaryLight,
    fontWeight: '600',
  },
});
