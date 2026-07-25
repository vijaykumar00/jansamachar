import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { AppButton, AppText, Badge, IconButton } from '@/components/ui/design-system';
import { summarizeNews } from '@/services/geminiService';

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
}

interface Props {
  item: NewsCardItem;
  index: number;
  featured?: boolean;
  variant?: NewsCardVariant;
}

const TRUST_CONFIG: Record<string, { label: string; tone: 'verified' | 'live' | 'warning' | 'fact' | 'muted' }> = {
  verified: { label: 'Verified', tone: 'verified' },
  youtube: { label: 'Video source', tone: 'live' },
  newsdata: { label: 'NewsData', tone: 'fact' },
  citizen: { label: 'Community report', tone: 'warning' },
  official: { label: 'Official', tone: 'fact' },
  breaking: { label: 'Breaking', tone: 'live' },
};

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

function NewsCard({ item, index, featured = false, variant }: Props) {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const [aiSummary, setAiSummary] = useState(item.aiSummary || '');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showSummary, setShowSummary] = useState(Boolean(item.aiSummary && featured));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay: Math.min(index, 4) * 45,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        delay: Math.min(index, 4) * 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const trust = TRUST_CONFIG[item.trustLevel] || TRUST_CONFIG.citizen;
  const computedVariant: NewsCardVariant = variant || (item.videoId || item.source === 'youtube' ? 'video' : item.category === 'state' ? 'local' : 'article');
  const isVideo = computedVariant === 'video' || item.source === 'youtube' || Boolean(item.videoId);
  const isLocal = computedVariant === 'local';
  const sourceLine = useMemo(() => {
    const bits = [item.channelName, timeAgo(item.publishedAt)];
    if (item.category) bits.push(item.category.replace('_', ' '));
    return bits.filter(Boolean).join(' • ');
  }, [item.category, item.channelName, item.publishedAt]);

  const openStory = () => {
    if (item.videoId) {
      Linking.openURL(`https://www.youtube.com/watch?v=${item.videoId}`);
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
        aiSummary: aiSummary || item.aiSummary || '',
      },
    });
  };

  const handleAI = async () => {
    setShowSummary((value) => !value);
    if (aiSummary || loadingAI) return;

    setLoadingAI(true);
    try {
      const summary = await summarizeNews(item.title, item.description || '', 'both');
      setAiSummary(summary);
    } catch (error) {
      setAiSummary('AI summary is unavailable right now. Please verify details with the original source.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleShare = () => {
    const text = `${item.title}\n\n${item.url || 'JanSamachar'}\n\nShared from JanSamachar`;
    Alert.alert('Share story', 'Choose an action', [
      { text: 'Open link', onPress: openStory },
      { text: 'WhatsApp', onPress: () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`) },
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
          featured && styles.featuredCard,
          isLocal && styles.localCard,
          {
            backgroundColor: C.card,
            borderColor: C.border,
            opacity: pressed ? 0.94 : 1,
          },
        ]}
      >
        {item.thumbnailUrl ? (
          <View style={styles.mediaWrap}>
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={[styles.media, featured && styles.featuredMedia]}
              contentFit="cover"
              transition={180}
              cachePolicy="memory-disk"
              accessibilityLabel=""
            />
            <View style={[styles.mediaShade, { backgroundColor: C.overlay }]} />
            <View style={styles.mediaBadges}>
              {isVideo ? <Badge label="Video" tone="live" icon="▶" /> : null}
              {item.hasDoc ? <Badge label="Source doc" tone="fact" icon="□" /> : null}
            </View>
          </View>
        ) : (
          <View style={[styles.noImage, { backgroundColor: C.surfaceElevated }]}>
            <AppText variant="badge" tone="muted">NO IMAGE</AppText>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <Badge label={trust.label} tone={trust.tone} />
            {isLocal ? <Badge label="Local signal" tone="local" /> : null}
            {item.aiSummary ? <Badge label="AI summary" tone="ai" /> : null}
          </View>

          <AppText variant={featured ? 'headline' : 'cardTitle'} numberOfLines={featured ? 3 : 2}>
            {item.title}
          </AppText>

          {item.description ? (
            <AppText variant="body" tone="secondary" numberOfLines={featured ? 3 : 2}>
              {item.description.replace(/<[^>]*>/g, '')}
            </AppText>
          ) : null}

          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {sourceLine}
          </AppText>

          {showSummary ? (
            <View style={[styles.aiBox, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
              <View style={styles.aiHeader}>
                <Badge label="AI generated" tone="ai" />
                {loadingAI ? <ActivityIndicator size="small" color={C.primary} /> : null}
              </View>
              <AppText variant="body" tone="secondary">
                {loadingAI ? 'Preparing a short summary...' : aiSummary}
              </AppText>
              <AppText variant="caption" tone="muted">
                AI summaries can make mistakes. Check the original source for critical details.
              </AppText>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              label={showSummary ? 'Hide AI' : 'AI summary'}
              variant="secondary"
              icon="AI"
              onPress={handleAI}
              accessibilityLabel="Toggle AI summary"
              style={styles.actionButton}
            />
            <IconButton label="Share story" icon="↗" onPress={handleShare} />
            <AppButton
              label={isVideo ? 'Watch' : 'Read'}
              onPress={openStory}
              accessibilityLabel={isVideo ? 'Watch video story' : 'Read full story'}
              style={styles.readButton}
            />
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
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  featuredCard: { borderRadius: radius.xl },
  localCard: { borderLeftWidth: 4 },
  mediaWrap: { position: 'relative', backgroundColor: '#111827' },
  media: { width: '100%', aspectRatio: 16 / 9 },
  featuredMedia: { aspectRatio: 1.75 },
  mediaShade: { ...StyleSheet.absoluteFill, opacity: 0.08 },
  mediaBadges: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  noImage: {
    aspectRatio: 16 / 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.md, gap: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  aiBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  actionButton: { flex: 1, minHeight: 42, paddingHorizontal: spacing.sm },
  readButton: { minWidth: 82, minHeight: 42, paddingHorizontal: spacing.md },
});
