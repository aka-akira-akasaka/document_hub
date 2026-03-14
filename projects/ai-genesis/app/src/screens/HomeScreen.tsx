import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useRecording, formatDuration } from '../hooks/useRecording';
import RecordButton from '../components/RecordButton';
import { transcribeAudio, deleteAudioFile } from '../services/whisper';
import { generateInsights } from '../services/claude';
import { createEntry, getTodayEntry, getStreak, getRecentKeywords } from '../services/supabase';
import { colors, spacing, typography } from '../config/theme';
import type { RootStackParamList } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const { recordingState, durationMs, startRecording, stopRecording, resetRecording } = useRecording();
  const [streak, setStreak] = useState(0);
  const [hasTodayEntry, setHasTodayEntry] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [todayEntryId, setTodayEntryId] = useState<string | null>(null);

  const today = format(new Date(), 'M月d日 EEEE', { locale: ja });

  useEffect(() => {
    if (!user) return;
    void loadTodayStatus();
  }, [user]);

  const loadTodayStatus = async () => {
    if (!user) return;
    const [todayEntry, currentStreak] = await Promise.all([
      getTodayEntry(user.id),
      getStreak(user.id),
    ]);
    setHasTodayEntry(!!todayEntry);
    setTodayEntryId(todayEntry?.id ?? null);
    setStreak(currentStreak);
  };

  const handlePressIn = useCallback(async () => {
    if (hasTodayEntry) {
      if (todayEntryId) navigation.navigate('Insight', { entryId: todayEntryId });
      return;
    }
    try {
      await startRecording();
    } catch (error) {
      Alert.alert('エラー', 'マイクを開始できませんでした。設定でマイクのアクセスを許可してください。');
    }
  }, [hasTodayEntry, todayEntryId, startRecording, navigation]);

  const handlePressOut = useCallback(async () => {
    if (recordingState !== 'recording') return;
    if (durationMs < 2000) {
      // 2秒未満は短すぎる
      resetRecording();
      Alert.alert('もう少し話してください', '2秒以上話してから指を離してください。');
      return;
    }

    try {
      const audioUri = await stopRecording();
      if (!audioUri || !user) return;

      setStatusMessage('文字起こし中...');

      // 文字起こし
      const transcription = await transcribeAudio(audioUri);

      if (!transcription || transcription.trim().length < 5) {
        resetRecording();
        setStatusMessage('');
        Alert.alert('聞き取れませんでした', 'もう一度試してください。');
        return;
      }

      setStatusMessage('AIが考えています...');

      // キーワード取得 + インサイト生成
      const recentKeywords = await getRecentKeywords(user.id);
      const insights = await generateInsights(transcription, recentKeywords);

      // DB保存
      const entryDate = new Date().toISOString().slice(0, 10);
      const entry = await createEntry(user.id, transcription, insights, entryDate);

      // 音声ファイル削除
      void deleteAudioFile(audioUri);

      setStatusMessage('');
      setHasTodayEntry(true);
      setTodayEntryId(entry.id);
      setStreak(prev => prev + 1);

      // インサイト画面へ
      navigation.navigate('Insight', { entryId: entry.id });
    } catch (error) {
      resetRecording();
      setStatusMessage('');
      console.error('処理エラー:', error);
      Alert.alert('エラーが発生しました', '通信状態を確認してもう一度試してください。');
    }
  }, [recordingState, durationMs, user, stopRecording, resetRecording, navigation]);

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        scrollEnabled={false}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.date}>{today}</Text>
          {streak > 0 && (
            <View style={styles.streak}>
              <Text style={styles.streakText}>🔥 {streak}日連続</Text>
            </View>
          )}
        </View>

        {/* メインコンテンツ */}
        <View style={styles.main}>
          {hasTodayEntry ? (
            <View style={styles.completedSection}>
              <Text style={styles.completedIcon}>✅</Text>
              <Text style={styles.completedTitle}>今日の記録、完了</Text>
              <Text style={styles.completedSub}>
                ボタンをタップしてインサイトを確認
              </Text>
            </View>
          ) : (
            <View style={styles.promptSection}>
              <Text style={styles.promptLabel}>今日の問い</Text>
              <Text style={styles.promptText}>
                {isRecording
                  ? '話しかけてください...'
                  : isProcessing
                  ? statusMessage || '処理中...'
                  : '今日はどんな一日でしたか？'}
              </Text>
            </View>
          )}

          {/* 録音ボタン */}
          <View style={styles.recordSection}>
            <RecordButton
              state={hasTodayEntry ? 'done' : recordingState}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />

            {isRecording && (
              <Text style={styles.duration}>{formatDuration(durationMs)}</Text>
            )}

            {!isRecording && !isProcessing && !hasTodayEntry && (
              <Text style={styles.hint}>
                タップして話す
              </Text>
            )}
          </View>
        </View>

        {/* フッター */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Echo — AI Journal</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  date: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  streak: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  streakText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  promptSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  promptLabel: {
    ...typography.label,
    color: colors.primaryLight,
    textTransform: 'uppercase',
  },
  promptText: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  completedSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  completedIcon: {
    fontSize: 48,
  },
  completedTitle: {
    ...typography.h3,
    color: colors.text,
  },
  completedSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  recordSection: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  duration: {
    ...typography.h2,
    color: colors.recording,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  footer: {
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
