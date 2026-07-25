import { Colors, type ColorSchemeName } from './colors';

export const spacing = {
  xxs: 4,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  section: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 12,
  xl: 12,
  card: 12,
  control: 8,
  sheet: 28,
  pill: 999,
  round: 999,
};

export const fontFamilies = {
  serif: 'Lora',
  sans: undefined,
};

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontFamily: fontFamilies.serif, fontWeight: '600' as const },
  screenTitle: { fontSize: 24, lineHeight: 30, fontFamily: fontFamilies.serif, fontWeight: '600' as const },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontFamily: fontFamilies.serif, fontWeight: '600' as const },
  headline: { fontSize: 18, lineHeight: 24, fontFamily: fontFamilies.serif, fontWeight: '600' as const },
  cardTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 26, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 26, fontWeight: '700' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  badge: { fontSize: 11, lineHeight: 14, fontWeight: '800' as const },
  button: { fontSize: 14, lineHeight: 18, fontWeight: '800' as const },
};

export const layout = {
  screenPadding: spacing.lg,
  tabBarHeight: 74,
  minTouch: 48,
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
  return { colors, spacing, radius, typography, fontFamilies, layout, iconSizes, motion, zIndex };
}

export type AppTheme = ReturnType<typeof getTheme>;
