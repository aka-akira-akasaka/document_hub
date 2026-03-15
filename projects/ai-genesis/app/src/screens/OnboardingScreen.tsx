import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../hooks/useAuth';
import { requestNotificationPermission, scheduleDailyReminder } from '../services/notifications';
import { colors, spacing, typography, radius } from '../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '🎙️',
    title: '話すだけでいい',
    description: 'テキストを入力する必要はありません。\nマイクをタップして、今日のことを話してください。\n1分でも、5分でも。',
  },
  {
    id: '2',
    icon: '🤖',
    title: 'AIが聴いて、返す',
    description: 'あなたの言葉からAIが3つの気づきを届けます。\n批判も評価もしません。\nただ、観察します。',
  },
  {
    id: '3',
    icon: '✉️',
    title: '毎週、手紙が届く',
    description: '7日間の声を読んで、AIがあなただけへの\nEchoレターを書きます。\n気づいていなかった自分に出会えます。',
  },
  {
    id: '4',
    icon: '🔔',
    title: '毎日のリマインダー',
    description: '続けることで記録が積み重なります。\n通知を許可して、忘れずに話しましょう。\n（後から設定でオフにできます）',
  },
];

export default function OnboardingScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { signIn, isLoading } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notificationRequested, setNotificationRequested] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const goToNext = async () => {
    if (currentIndex === SLIDES.length - 2) {
      // 通知許可スライドに到達する直前ではなく、到達したとき
    }

    if (isLastSlide) {
      // 通知許可を求める
      if (!notificationRequested) {
        setNotificationRequested(true);
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleDailyReminder(8); // デフォルト8時
        }
      }
      onComplete();
      return;
    }

    const nextIndex = currentIndex + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const fullName = credential.fullName
        ? `${credential.fullName.familyName ?? ''}${credential.fullName.givenName ?? ''}`.trim() || null
        : null;
      await signIn(credential.identityToken!, fullName);
    } catch (error: unknown) {
      if ((error as { code?: string }).code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple Sign Inエラー:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* スライド */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <Text style={styles.slideIcon}>{item.icon}</Text>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDesc}>{item.description}</Text>
          </View>
        )}
      />

      {/* ドットインジケータ */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const inputRange = [
            (i - 1) * SCREEN_WIDTH,
            i * SCREEN_WIDTH,
            (i + 1) * SCREEN_WIDTH,
          ];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>

      {/* アクションボタン */}
      <View style={styles.actions}>
        {currentIndex === 0 ? (
          // 最初のスライド: Apple Sign In + スキップ
          <>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={14}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
            <TouchableOpacity onPress={goToNext} style={styles.skipBtn}>
              <Text style={styles.skipText}>まず見てみる</Text>
            </TouchableOpacity>
          </>
        ) : isLastSlide ? (
          // 最後のスライド: 通知許可 + 始める
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={goToNext} disabled={isLoading}>
              <Text style={styles.primaryBtnText}>
                {isLoading ? '準備中...' : '通知を許可して始める'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onComplete} style={styles.skipBtn}>
              <Text style={styles.skipText}>あとで設定する</Text>
            </TouchableOpacity>
          </>
        ) : (
          // 中間スライド: 次へ
          <TouchableOpacity style={styles.primaryBtn} onPress={goToNext}>
            <Text style={styles.primaryBtnText}>次へ</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  slideIcon: {
    fontSize: 80,
  },
  slideTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  slideDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 54,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.lg,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  skipBtn: {
    padding: spacing.sm,
  },
  skipText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
