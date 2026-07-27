import React, { memo, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { AppIcon, AppText, Badge, IconButton } from '@/components/ui/design-system';
import { openExternalUrl } from '@/services/linkService';
import { useProfileStore, useResolvedColorScheme } from '@/store/userProfileStore';

export type NewsCardVariant = 'article' | 'video' | 'local';

export interface NewsCardItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  channelName: string;
  publishedAt: string;
  url?: string;
  videoId?: string;
  source: string;
  trustLevel: string;
  hasDoc?: boolean;
  category?: string;
  aiSummary?: string;
  duration?: string;
  sourceType?: 'verified_publisher' | 'citizen_report';
  channelLogoUrl?: string | null;
}

interface Props {
  item: NewsCardItem;
  index: number;
  featured?: boolean;
  variant?: NewsCardVariant;
}

const TRUST_CONFIG: Record<string, { label: string; tone: 'verified' | 'live' | 'warning' | 'fact' | 'topic' }> = {
  verified: { label: 'Verified', tone: 'verified' },
  youtube: { label: 'Video source', tone: 'live' },
  newsdata: { label: 'NewsData', tone: 'fact' },
  citizen: { label: 'Community report', tone: 'warning' },
  official: { label: 'Official', tone: 'fact' },
  breaking: { label: 'Breaking', tone: 'live' },
};

const IMAGE_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

function timeAgo(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (!Number.isFinite(then)) return 'recent';
  const diff = Date.now() - then;
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NewsCard({ item, index, variant }: Props) {
  const isDark = useResolvedColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const dataSaver = useProfileStore((state) => state.profile.dataSaver);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;
      if (reduceMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
        return;
      }

      animation = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          delay: Math.min(index, 8) * 30,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          delay: Math.min(index, 8) * 30,
          useNativeDriver: true,
        }),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [index, opacity, translateY]);

  const trust = TRUST_CONFIG[item.trustLevel] || TRUST_CONFIG.citizen;
  const computedVariant: NewsCardVariant =
    variant || (item.videoId || item.source === 'youtube' ? 'video' : item.category === 'state' ? 'local' : 'article');
  const isVideo = computedVariant === 'video' || item.source === 'youtube' || Boolean(item.videoId);
  const isLocal = computedVariant === 'local';
  const sourceType = item.sourceType || (item.trustLevel === 'citizen' ? 'citizen_report' : 'verified_publisher');
  const logoLetter = (item.channelName || 'J').trim().charAt(0).toUpperCase();
  const summarySnippet = item.aiSummary?.replace(/\s+/g, ' ').replace(/^[-•]\s*/, '').trim() || '';

  const openStory = () => {
    if (item.videoId) {
      openExternalUrl(`https://www.youtube.com/watch?v=${item.videoId}`);
      return;
    }

    router.push({
      pathname: '/modal',
      params: {
        id: item.id,
        title: item.title,
        description: item.description || '',
        source: item.channelName,
        publishedAt: item.publishedAt,
        url: item.url || '',
        thumbnailUrl: item.thumbnailUrl || '',
        trustLevel: item.trustLevel,
        category: item.category || '',
        aiSummary: item.aiSummary || '',
      },
    });
  };

  const handleSave = () => {
    Alert.alert('Saved', 'Story added to saved items.');
  };

  const handleShare = () => {
    const text = `${item.title}\n\n${item.url || 'JanSamachar'}\n\nShared from JanSamachar`;
    Alert.alert('Share story', 'Choose an action', [
      { text: 'Open link', onPress: openStory },
      { text: 'WhatsApp', onPress: () => openExternalUrl(`whatsapp://send?text=${encodeURIComponent(text)}`) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open story: ${item.title}`}
        onPress={openStory}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: C.card,
            borderColor: C.border,
            opacity: pressed ? 0.94 : 1,
          },
        ]}
      >
        <View style={styles.mediaWrap}>
          {item.thumbnailUrl && !dataSaver ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              placeholder={IMAGE_BLURHASH}
              style={styles.media}
              contentFit="cover"
              transition={180}
              cachePolicy="memory-disk"
              accessibilityLabel=""
            />
          ) : (
            <View style={[styles.media, styles.noImage, { backgroundColor: C.surfaceElevated }]}>
              <AppIcon name={dataSaver ? 'offline' : 'image'} color={C.textMuted} size={24} />
              <AppText variant="badge" tone="muted">{dataSaver ? 'PREVIEW OFF' : 'NO IMAGE'}</AppText>
            </View>
          )}

          <View style={[styles.mediaShade, { backgroundColor: C.overlay }]} />
          <View style={styles.publisherOverlay}>
            {item.channelLogoUrl ? (
              <Image source={{ uri: item.channelLogoUrl }} style={styles.publisherLogo} contentFit="cover" />
            ) : (
              <View style={[styles.publisherLogo, { backgroundColor: C.bgCard }]}>
                <AppText variant="badge">{logoLetter}</AppText>
              </View>
            )}
            <AppText variant="caption" tone="inverse" numberOfLines={1} style={styles.publisherName}>
              {item.channelName}
            </AppText>
          </View>

          {isVideo ? (
            <>
              <View style={[styles.playOverlay, { backgroundColor: C.overlay }]}>
                <AppIcon name="play" color={C.textInverse} size={24} />
              </View>
              <View style={[styles.durationBadge, { backgroundColor: C.overlay }]}>
                <AppText variant="badge" tone="inverse">{item.duration || 'LIVE'}</AppText>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Badge label={trust.label} tone={trust.tone} />
            {isLocal ? (
              <Badge
                label={sourceType}
                tone={sourceType === 'verified_publisher' ? 'verified' : 'topic'}
              />
            ) : null}
          </View>

          <AppText variant="headline" numberOfLines={2} style={styles.headline}>
            {item.title}
          </AppText>

          <AppText variant="caption" tone="secondary" numberOfLines={1} style={styles.summarySlot}>
            {summarySnippet || ' '}
          </AppText>

          <View style={styles.footerRow}>
            <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.footerTime}>
              {timeAgo(item.publishedAt)}
            </AppText>
            <IconButton label="Save story" icon="save" onPress={handleSave} style={styles.footerIcon} />
            <IconButton label="Share story" icon="share" onPress={handleShare} style={styles.footerIcon} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default memo(NewsCard);

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md, marginHorizontal: spacing.lg },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: Colors.light.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mediaWrap: { position: 'relative', backgroundColor: Colors.dark.bgPage },
  media: { width: '100%', aspectRatio: 16 / 9 },
  mediaShade: { ...StyleSheet.absoluteFill, opacity: 0.16 },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  publisherOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  publisherLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  publisherName: { flex: 1, textShadowColor: Colors.dark.bgPage, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  playOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    width: 52,
    height: 52,
    marginTop: -26,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.control,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  body: {
    height: 184,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metaRow: { height: 26, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, overflow: 'hidden' },
  headline: { minHeight: 48 },
  summarySlot: { height: 18 },
  footerRow: { height: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 'auto' },
  footerTime: { flex: 1 },
  footerIcon: {
    width: 48,
    height: 48,
    minWidth: 48,
    minHeight: 48,
    borderRadius: radius.control,
  },
});
