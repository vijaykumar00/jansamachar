import { Colors, type ColorSchemeName } from './colors';

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  round: 999,
};

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '900' as const },
  screenTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900' as const },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800' as const },
  headline: { fontSize: 17, lineHeight: 24, fontWeight: '800' as const },
  cardTitle: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
  bodyStrong: { fontSize: 14, lineHeight: 21, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  badge: { fontSize: 11, lineHeight: 14, fontWeight: '800' as const },
  button: { fontSize: 14, lineHeight: 18, fontWeight: '800' as const },
};

export const layout = {
  screenPadding: spacing.lg,
  tabBarHeight: 74,
  minTouch: 44,
  maxContentWidth: 720,
};

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const motion = {
  fast: 160,
  normal: 240,
  slow: 360,
};

export const zIndex = {
  header: 10,
  modal: 40,
  toast: 60,
};

export function getTheme(scheme: ColorSchemeName) {
  const colors = Colors[scheme];
  return { colors, spacing, radius, typography, layout, iconSizes, motion, zIndex };
}

export type AppTheme = ReturnType<typeof getTheme>;
