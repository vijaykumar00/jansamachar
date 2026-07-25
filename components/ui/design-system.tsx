import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  useColorScheme,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { layout, radius, spacing, typography } from '@/constants/theme';

type Tone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'danger' | 'success' | 'info';
type AppTextVariant = keyof typeof typography;
type BadgeTone = 'primary' | 'verified' | 'live' | 'ai' | 'fact' | 'muted' | 'warning' | 'local' | 'video' | 'saved';

export function useThemeColors() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return Colors[scheme];
}

export function AppText({
  variant = 'body',
  tone = 'primary',
  style,
  ...props
}: TextProps & { variant?: AppTextVariant; tone?: Tone }) {
  const C = useThemeColors();
  const toneColor: Record<Tone, string> = {
    primary: C.text,
    secondary: C.textSecondary,
    muted: C.textMuted,
    inverse: C.textInverse,
    danger: C.error,
    success: C.success,
    info: C.info,
  };

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.35}
      style={[typography[variant], { color: toneColor[tone] }, style]}
      {...props}
    />
  );
}

export function Screen({
  children,
  padded = false,
  style,
  ...props
}: ViewProps & { padded?: boolean }) {
  const C = useThemeColors();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: C.background }, padded && styles.padded, style]} {...props}>
      {children}
    </SafeAreaView>
  );
}

export function JanSamacharLogo({
  compact = false,
  wordmark = true,
  style,
}: {
  compact?: boolean;
  wordmark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useThemeColors();
  const size = compact ? 36 : 48;
  return (
    <View style={[styles.logoRow, style]} accessibilityRole="image" accessibilityLabel="JanSamachar logo">
      <View style={[styles.logoMark, { width: size, height: size, borderRadius: size / 3, backgroundColor: C.primary }]}>
        <View style={[styles.logoCard, { borderColor: C.textInverse }]} />
        <Text style={[styles.logoJ, { color: C.textInverse, fontSize: compact ? 21 : 27 }]}>J</Text>
        <View style={[styles.logoSignal, { backgroundColor: C.accent }]} />
      </View>
      {wordmark && (
        <View>
          <AppText variant={compact ? 'headline' : 'screenTitle'} style={{ letterSpacing: 0 }}>
            JanSamachar
          </AppText>
          {!compact && <AppText variant="caption" tone="secondary">Truth-first news for India</AppText>}
        </View>
      )}
    </View>
  );
}

export function AppButton({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  ...props
}: PressableProps & {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  textStyle?: TextProps['style'];
}) {
  const C = useThemeColors();
  const variantStyle = {
    primary: { backgroundColor: C.primary, borderColor: C.primary },
    secondary: { backgroundColor: C.surfaceElevated, borderColor: C.border },
    ghost: { backgroundColor: 'transparent', borderColor: C.border },
    danger: { backgroundColor: C.live, borderColor: C.live },
  }[variant];
  const labelColor = variant === 'primary' || variant === 'danger' ? C.textInverse : C.text;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSmall,
        variantStyle,
        { opacity: pressed ? 0.82 : 1 },
        style as ViewStyle,
      ]}
      {...props}
    >
      {icon ? <Text style={[styles.buttonIcon, { color: labelColor }]}>{icon}</Text> : null}
      <Text style={[typography.button, { color: labelColor }, textStyle]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({ label, icon, style, ...props }: PressableProps & { label: string; icon: string }) {
  const C = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: C.surfaceElevated, borderColor: C.border, opacity: pressed ? 0.78 : 1 },
        style as ViewStyle,
      ]}
      {...props}
    >
      <Text style={[styles.iconText, { color: C.icon }]}>{icon}</Text>
    </Pressable>
  );
}

export function Badge({
  label,
  tone = 'muted',
  icon,
  style,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useThemeColors();
  const color = {
    primary: C.primary,
    verified: C.verified,
    live: C.live,
    ai: C.trustAI,
    fact: C.factCheck,
    muted: C.textMuted,
    warning: C.warning,
    local: C.local,
    video: C.video,
    saved: C.saved,
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: color + '1F', borderColor: color + '55' }, style]}>
      {icon ? <Text style={[styles.badgeIcon, { color }]}>{icon}</Text> : null}
      <Text style={[typography.badge, { color }]}>{label}</Text>
    </View>
  );
}

export function Chip({
  label,
  selected = false,
  icon,
  compact = false,
  style,
  ...props
}: PressableProps & { label: string; selected?: boolean; icon?: string; compact?: boolean }) {
  const C = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
        {
          backgroundColor: selected ? C.primary : C.surface,
          borderColor: selected ? C.primary : C.border,
          opacity: pressed ? 0.8 : 1,
        },
        style as ViewStyle,
      ]}
      {...props}
    >
      {icon ? <Text style={[styles.chipIcon, { color: selected ? C.textInverse : C.icon }]}>{icon}</Text> : null}
      <Text style={[typography.caption, { color: selected ? C.textInverse : C.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({ title, eyebrow, actionLabel, onAction }: {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const C = useThemeColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <AppText variant="caption" tone="muted">{eyebrow}</AppText> : null}
        <AppText variant="sectionTitle">{title}</AppText>
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={[typography.caption, { color: C.primary, fontWeight: '800' }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SearchField({
  containerStyle,
  inputStyle,
  ...props
}: Omit<TextInputProps, 'style'> & { containerStyle?: StyleProp<ViewStyle>; inputStyle?: TextInputProps['style'] }) {
  const C = useThemeColors();
  return (
    <View style={[styles.searchField, { backgroundColor: C.surface, borderColor: C.border }, containerStyle]}>
      <Text style={[styles.searchIcon, { color: C.textMuted }]}>Q</Text>
      <TextInput
        placeholderTextColor={C.textMuted}
        style={[styles.searchInput, { color: C.text }, inputStyle]}
        accessibilityLabel={props.accessibilityLabel || 'Search'}
        {...props}
      />
    </View>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyMark}>
        <Text style={styles.emptyMarkText}>i</Text>
      </View>
      <AppText variant="sectionTitle" style={{ textAlign: 'center' }}>{title}</AppText>
      <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>{message}</AppText>
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} style={{ marginTop: spacing.sm }} /> : null}
    </View>
  );
}

export function LoadingState({ label = 'Loading latest stories...' }: { label?: string }) {
  const C = useThemeColors();
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={C.primary} size="large" />
      <AppText variant="bodyStrong" tone="secondary" style={{ textAlign: 'center' }}>{label}</AppText>
      <View style={styles.skeletonStack}>
        <SkeletonBlock height={86} />
        <SkeletonBlock height={138} />
        <SkeletonBlock height={86} />
      </View>
    </View>
  );
}

export function SkeletonBlock({
  height = 72,
  width = '100%',
  borderRadius = radius.lg,
}: {
  height?: number;
  width?: number | `${number}%`;
  borderRadius?: number;
}) {
  const C = useThemeColors();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 720, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 720, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { height, width, borderRadius, backgroundColor: C.skeleton, opacity },
      ]}
    />
  );
}

export function BottomSheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const C = useThemeColors();
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(24);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          style={[styles.sheetBackdrop, { backgroundColor: C.overlay }]}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheetPanel,
            {
              backgroundColor: C.card,
              borderColor: C.border,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          {title ? (
            <View style={styles.sheetHeader}>
              <AppText variant="sectionTitle">{title}</AppText>
              <IconButton label="Close" icon="X" onPress={onClose} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padded: { paddingHorizontal: layout.screenPadding },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoMark: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoCard: {
    position: 'absolute',
    width: '58%',
    height: '66%',
    borderWidth: 2,
    borderRadius: radius.xs,
    opacity: 0.78,
    transform: [{ rotate: '-8deg' }],
  },
  logoJ: { fontWeight: '900', lineHeight: 32 },
  logoSignal: { position: 'absolute', width: 8, height: 8, borderRadius: 4, right: 8, top: 8 },
  button: {
    minHeight: layout.minTouch,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonSmall: {
    minHeight: 36,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonIcon: { fontSize: 16, fontWeight: '900' },
  iconButton: {
    width: layout.minTouch,
    height: layout.minTouch,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20, fontWeight: '800' },
  badge: {
    minHeight: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeIcon: { fontSize: 10, fontWeight: '900' },
  chip: {
    minHeight: 36,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipCompact: {
    minHeight: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipIcon: { fontSize: 13, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  searchField: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 20, fontWeight: '800' },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: spacing.sm },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyMark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E85D0420',
  },
  emptyMarkText: { color: '#E85D04', fontSize: 25, fontWeight: '900', fontStyle: 'italic' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  skeletonStack: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.lg },
  skeleton: {},
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFill },
  sheetPanel: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    maxHeight: '82%',
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8B98A8',
    alignSelf: 'center',
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});
