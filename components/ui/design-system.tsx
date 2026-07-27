import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
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
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import GorhomBottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { layout, radius, spacing, typography } from '@/constants/theme';
import { useResolvedColorScheme } from '@/store/userProfileStore';

type Tone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'danger' | 'success' | 'info';
type AppTextVariant = keyof typeof typography;
type BadgeTone = 'primary' | 'verified' | 'live' | 'topic' | 'ai' | 'fact' | 'muted' | 'warning' | 'local' | 'video' | 'saved';
export type AppIconName =
  | 'home'
  | 'search'
  | 'local'
  | 'video'
  | 'profile'
  | 'close'
  | 'refresh'
  | 'save'
  | 'share'
  | 'check'
  | 'info'
  | 'image'
  | 'play'
  | 'chevronRight'
  | 'lock'
  | 'bell'
  | 'textSize'
  | 'document'
  | 'history'
  | 'offline';

const ICON_SYMBOLS: Record<AppIconName, { ios: string; android: string; fallback: string }> = {
  home: { ios: 'house.fill', android: 'home', fallback: '⌂' },
  search: { ios: 'magnifyingglass', android: 'search', fallback: '?' },
  local: { ios: 'mappin.and.ellipse', android: 'location_on', fallback: '⌖' },
  video: { ios: 'play.rectangle.fill', android: 'smart_display', fallback: '▶' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', fallback: '●' },
  close: { ios: 'xmark', android: 'close', fallback: '×' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', fallback: '↻' },
  save: { ios: 'bookmark', android: 'bookmark', fallback: '□' },
  share: { ios: 'square.and.arrow.up', android: 'share', fallback: '↗' },
  check: { ios: 'checkmark', android: 'check', fallback: '✓' },
  info: { ios: 'info.circle', android: 'info', fallback: 'i' },
  image: { ios: 'photo', android: 'image', fallback: '▧' },
  play: { ios: 'play.fill', android: 'play_arrow', fallback: '▶' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', fallback: '›' },
  lock: { ios: 'lock', android: 'lock', fallback: '•' },
  bell: { ios: 'bell', android: 'notifications', fallback: '!' },
  textSize: { ios: 'textformat.size', android: 'format_size', fallback: 'A' },
  document: { ios: 'doc.text', android: 'description', fallback: '□' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', fallback: '↺' },
  offline: { ios: 'wifi.slash', android: 'cloud_off', fallback: '!' },
};

export function useThemeColors() {
  const scheme = useResolvedColorScheme();
  return Colors[scheme];
}

export function AppIcon({
  name,
  color,
  size = 20,
  style,
}: {
  name: AppIconName;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useThemeColors();
  const symbol = ICON_SYMBOLS[name];
  const tintColor = color || C.icon;

  return (
    <SymbolView
      name={{ ios: symbol.ios as any, android: symbol.android as any, web: symbol.android as any }}
      size={size}
      tintColor={tintColor}
      fallback={<Text style={[styles.symbolFallback, { color: tintColor, fontSize: size }]}>{symbol.fallback}</Text>}
      style={[{ width: size, height: size }, style]}
    />
  );
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
      maxFontSizeMultiplier={2}
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
  icon?: AppIconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  textStyle?: TextProps['style'];
}) {
  const C = useThemeColors();
  const variantStyle = {
    primary: { backgroundColor: C.coral, borderColor: C.coral },
    secondary: { backgroundColor: 'transparent', borderColor: C.border },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    danger: { backgroundColor: C.live, borderColor: C.live },
  }[variant];
  const labelColor = variant === 'primary' || variant === 'danger' ? C.textInverse : variant === 'ghost' ? C.coral : C.text;

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
      {icon ? <AppIcon name={icon} color={labelColor} size={16} /> : null}
      <Text style={[typography.button, { color: labelColor }, textStyle]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({ label, icon, style, ...props }: PressableProps & { label: string; icon: AppIconName }) {
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
      <AppIcon name={icon} color={C.icon} size={20} />
    </Pressable>
  );
}

export function Badge({
  label,
  tone = 'muted',
  icon,
  style,
}: {
  label?: string;
  tone?: BadgeTone;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useThemeColors();
  const color = {
    primary: C.primary,
    verified: C.verified,
    live: C.live,
    topic: C.textMuted,
    ai: C.trustAI,
    fact: C.factCheck,
    muted: C.textMuted,
    warning: C.warning,
    local: C.local,
    video: C.video,
    saved: C.saved,
  }[tone];
  const displayLabel = label || (tone === 'verified' ? 'Verified' : tone === 'live' ? 'LIVE' : '');
  const displayIcon = icon;
  return (
    <View style={[styles.badge, { backgroundColor: color + '1F', borderColor: color + '55' }, style]}>
      {tone === 'live' ? <LivePulseDot color={color} /> : null}
      {!displayIcon && tone === 'verified' ? <AppIcon name="check" color={color} size={12} /> : null}
      {displayIcon ? <Text style={[styles.badgeIcon, { color }]}>{displayIcon}</Text> : null}
      {displayLabel ? <Text style={[typography.badge, { color }]}>{displayLabel}</Text> : null}
    </View>
  );
}

function LivePulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;
      animation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.45, duration: 620, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 620, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.48, duration: 620, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 620, useNativeDriver: true }),
          ]),
        ])
      );
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.livePulseDot,
        { backgroundColor: color, opacity, transform: [{ scale }] },
      ]}
    />
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
      <AppIcon name="search" color={C.textMuted} size={20} />
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
        <AppIcon name="info" color={Colors.light.coral} size={25} />
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
  snapPoints = ['45%', '82%'],
}: {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  snapPoints?: Array<string | number>;
}) {
  const C = useThemeColors();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.sheetRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          style={[styles.sheetBackdrop, { backgroundColor: C.overlay }]}
          onPress={onClose}
        />
        <GorhomBottomSheet
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          onClose={onClose}
          backgroundStyle={{ backgroundColor: C.card, borderColor: C.border }}
          handleIndicatorStyle={{ backgroundColor: C.textMuted }}
          style={styles.gorhomSheet}
        >
          <BottomSheetView style={styles.sheetContent}>
            {title ? (
              <View style={styles.sheetHeader}>
                <AppText variant="sectionTitle">{title}</AppText>
                <IconButton label="Close" icon="close" onPress={onClose} />
              </View>
            ) : null}
            {children}
          </BottomSheetView>
        </GorhomBottomSheet>
      </GestureHandlerRootView>
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
    minHeight: layout.minTouch,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  symbolFallback: { fontWeight: '900', lineHeight: 22, textAlign: 'center' },
  iconButton: {
    width: layout.minTouch,
    height: layout.minTouch,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minHeight: 28,
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
  livePulseDot: { width: 7, height: 7, borderRadius: 4 },
  chip: {
    minHeight: layout.minTouch,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipCompact: {
    minHeight: layout.minTouch,
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
    backgroundColor: Colors.light.coral + '20',
  },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  skeletonStack: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.lg },
  skeleton: {},
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFill },
  gorhomSheet: { overflow: 'hidden' },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});
