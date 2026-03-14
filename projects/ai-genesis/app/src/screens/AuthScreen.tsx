import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, typography } from '../config/theme';

export default function AuthScreen() {
  const { signIn, isLoading } = useAuth();

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
      if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return; // ユーザーがキャンセル
      Alert.alert('サインインエラー', 'もう一度お試しください。');
      console.error('Apple Sign Inエラー:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* ロゴ */}
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>🎙️</Text>
          <Text style={styles.logoText}>Echo</Text>
          <Text style={styles.tagline}>話すだけで、自分が見えてくる。</Text>
        </View>

        {/* 説明 */}
        <View style={styles.features}>
          <FeatureItem icon="🎤" text="マイクをタップして今日の気持ちを話す" />
          <FeatureItem icon="🤖" text="AIが聴いて、3つの気づきを返す" />
          <FeatureItem icon="✉️" text="毎週、あなただけへのEchoレターが届く" />
        </View>

        {/* Apple Sign Inボタン */}
        <View style={styles.signInSection}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={14}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}
          <Text style={styles.terms}>
            続けることで、プライバシーポリシーと利用規約に同意したことになります。
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  logoIcon: {
    fontSize: 64,
  },
  logoText: {
    ...typography.h1,
    color: colors.text,
    fontSize: 42,
    letterSpacing: 4,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  features: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  featureText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  signInSection: {
    gap: spacing.md,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 54,
  },
  terms: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
