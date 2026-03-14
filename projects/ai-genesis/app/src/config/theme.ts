// Echo デザインシステム
export const colors = {
  bg: '#0A0A0A',
  bgCard: '#1A1A1A',
  bgCardAlt: '#242424',
  primary: '#7C3AED',       // バイオレット（メインカラー）
  primaryLight: '#A78BFA',
  primaryDim: '#4C1D95',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#4B5563',
  border: '#2D2D2D',
  error: '#EF4444',
  success: '#10B981',
  recording: '#EF4444',     // 録音中は赤
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.5 },
};
