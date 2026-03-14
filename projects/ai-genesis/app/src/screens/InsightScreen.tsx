import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { getEntryById } from '../services/supabase';
import { colors, spacing, typography, radius } from '../config/theme';
import type { Entry, RootStackParamList } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'Insight'>;

export default function InsightScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RouteType>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadEntry();
  }, [params.entryId]);

  const loadEntry = async () => {
    const data = await getEntryById(params.entryId);
    setEntry(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>記録が見つかりませんでした</Text>
      </View>
    );
  }

  const dateLabel = format(new Date(entry.entryDate + 'T00:00:00'), 'M月d日 EEEE', { locale: ja });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerDate}>{dateLabel}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* キーワード */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S KEYWORDS</Text>
          <View style={styles.keywords}>
            {entry.insights.keywords.map((kw, i) => (
              <View key={i} style={styles.keyword}>
                <Text style={styles.keywordText}>{kw}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 気づき */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AIからの気づき</Text>
          <View style={styles.insightsList}>
            {entry.insights.insights.map((insight, i) => (
              <View key={i} style={styles.insightItem}>
                <Text style={styles.insightNumber}>{i + 1}</Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 問い */}
        <View style={[styles.section, styles.questionSection]}>
          <Text style={styles.sectionLabel}>明日への問い</Text>
          <Text style={styles.questionText}>"{entry.insights.question}"</Text>
        </View>

        {/* 元の音声テキスト（折りたたみ） */}
        <TranscriptSection text={entry.transcription} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TranscriptSection({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => setIsExpanded(prev => !prev)}
        style={styles.transcriptHeader}
      >
        <Text style={styles.sectionLabel}>あなたの言葉</Text>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isExpanded && (
        <Text style={styles.transcriptText}>{text}</Text>
      )}
    </View>
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
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
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
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  headerDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  keywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  keyword: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  keywordText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  insightsList: {
    gap: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  insightNumber: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
    minWidth: 20,
    marginTop: 2,
  },
  insightText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
  questionSection: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  questionText: {
    ...typography.h3,
    color: colors.text,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    color: colors.textMuted,
    fontSize: 12,
  },
  transcriptText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 26,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
