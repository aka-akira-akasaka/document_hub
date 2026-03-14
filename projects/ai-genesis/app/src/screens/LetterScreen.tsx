import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { getLetters, markLetterAsRead } from '../services/supabase';
import { colors, spacing, typography, radius } from '../config/theme';
import type { Letter, RootStackParamList } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function LetterScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const loadLetters = useCallback(async () => {
    if (!user) return;
    const data = await getLetters(user.id);
    setLetters(data);
  }, [user]);

  useEffect(() => {
    void loadLetters().finally(() => setIsLoading(false));
  }, [loadLetters]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadLetters();
    setIsRefreshing(false);
  }, [loadLetters]);

  const handleLetterPress = async (letter: Letter) => {
    if (user?.subscriptionStatus !== 'pro') {
      navigation.navigate('Paywall', { trigger: 'feature' });
      return;
    }
    setSelectedLetter(letter);
    if (!letter.isRead) {
      await markLetterAsRead(letter.id);
      setLetters(prev =>
        prev.map(l => l.id === letter.id ? { ...l, isRead: true } : l)
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (user?.subscriptionStatus !== 'pro') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Echoレター</Text>
        </View>
        <View style={styles.proGate}>
          <Text style={styles.proGateIcon}>✉️</Text>
          <Text style={styles.proGateTitle}>週次Echoレター</Text>
          <Text style={styles.proGateDesc}>
            AIが毎週日曜、あなただけへの手紙を書きます。
            7日間の言葉からパターンと変化を読み取り、あなた自身が気づいていないことを届けます。
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('Paywall', { trigger: 'feature' })}
          >
            <Text style={styles.upgradeBtnText}>Proにアップグレード</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Echoレター</Text>
      </View>

      <FlatList
        data={letters}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <LetterCard letter={item} onPress={() => handleLetterPress(item)} />
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
            <Text style={styles.emptyIcon}>✉️</Text>
            <Text style={styles.emptyText}>まだレターがありません</Text>
            <Text style={styles.emptySubText}>
              毎週日曜に、その週の記録からEchoレターが生成されます
            </Text>
          </View>
        }
      />

      {/* レター詳細モーダル */}
      <Modal
        visible={!!selectedLetter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedLetter(null)}
      >
        {selectedLetter && (
          <LetterDetailModal
            letter={selectedLetter}
            onClose={() => setSelectedLetter(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

function LetterCard({ letter, onPress }: { letter: Letter; onPress: () => void }) {
  const weekLabel = format(new Date(letter.weekStart + 'T00:00:00'), 'M月d日', { locale: ja }) +
    '〜の週';
  const preview = letter.content.slice(0, 80) + '...';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardWeek}>{weekLabel}</Text>
        {!letter.isRead && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.cardPreview} numberOfLines={2}>{preview}</Text>
    </TouchableOpacity>
  );
}

function LetterDetailModal({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  const weekLabel = format(new Date(letter.weekStart + 'T00:00:00'), 'M月d日', { locale: ja }) +
    'の週のEchoレター';

  return (
    <SafeAreaView style={styles.modal}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Echoレター</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.letterWeek}>{weekLabel}</Text>
        <Text style={styles.letterBody}>{letter.content}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.text },
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
  cardWeek: { ...typography.label, color: colors.textSecondary },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  cardPreview: { ...typography.body, color: colors.text, lineHeight: 22 },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl * 2 },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...typography.h3, color: colors.textSecondary },
  emptySubText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  proGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  proGateIcon: { fontSize: 64 },
  proGateTitle: { ...typography.h2, color: colors.text },
  proGateDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  upgradeBtnText: { ...typography.body, color: colors.text, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
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
  modalTitle: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  modalContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  letterWeek: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase' },
  letterBody: { ...typography.body, color: colors.text, lineHeight: 30 },
});
