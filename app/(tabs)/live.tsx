import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StatusBar, StyleSheet, View, useWindowDimensions, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { createFallbackMeta, fallbackLabel } from '@/services/fallbackService';
import { searchYouTubeNews, ytSearchToNewsItem } from '@/services/youtubeSearchService';
import { AppIcon, AppText, Badge, EmptyState, IconButton, LoadingState, Screen, SectionHeader } from '@/components/ui/design-system';
import { useProfileStore, useResolvedColorScheme } from '@/store/userProfileStore';
import type { NewsCardItem } from '@/components/AnimatedNewsCard';

type LongFormItem = {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoId?: string;
  isLive?: boolean;
  viewers?: number;
};

async function loadVideoTab() {
  const [clips, longForm] = await Promise.allSettled([
    searchYouTubeNews('India news shorts latest clips', 18),
    searchYouTubeNews('India news live long form analysis', 10),
  ]);

  const clipItems = clips.status === 'fulfilled' ? clips.value.map(ytSearchToNewsItem) : [];
  const longItems = longForm.status === 'fulfilled' ? longForm.value.map(ytSearchToNewsItem) : [];

  const usingFallback = clipItems.length === 0 && longItems.length === 0;

  return {
    clips: clipItems.map((item, index): NewsCardItem => ({
      ...item,
      duration: index % 3 === 0 ? '0:45' : index % 3 === 1 ? '1:20' : '2:10',
    })),
    longForm: longItems.map((item): LongFormItem => ({
      id: item.id,
      title: item.title,
      channelName: item.channelName,
      thumbnailUrl: item.thumbnailUrl || '',
      videoId: item.videoId,
    })),
    fallbackLabel: usingFallback ? fallbackLabel(createFallbackMeta('empty_response', 'video sources')) : '',
  };
}

function formatViewers(n?: number): string {
  if (!n) return '';
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L watching`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K watching`;
  return `${n} watching`;
}

function LongFormCard({ item, selected, onSelect }: { item: LongFormItem; selected: boolean; onSelect: () => void }) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  const dataSaver = useProfileStore((state) => state.profile.dataSaver);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title}`}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.longCard,
        { backgroundColor: C.card, borderColor: selected ? C.coral : C.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      {item.thumbnailUrl && !dataSaver ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.longThumb} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[styles.longThumb, styles.fallbackThumb, { backgroundColor: C.surfaceElevated }]}>
          <AppIcon name={dataSaver ? 'offline' : 'video'} color={C.textMuted} size={24} />
          <AppText variant="badge" tone="muted">{dataSaver ? 'PREVIEW OFF' : 'VIDEO'}</AppText>
        </View>
      )}
      <View style={styles.longBody}>
        <View style={styles.longTop}>
          <Badge label={item.isLive ? 'LIVE' : 'Long-form'} tone={item.isLive ? 'live' : 'video'} />
          {item.viewers ? <AppText variant="caption" tone="muted">{formatViewers(item.viewers)}</AppText> : null}
        </View>
        <AppText variant="cardTitle" numberOfLines={2}>{item.title}</AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>{item.channelName}</AppText>
      </View>
    </Pressable>
  );
}

function VideoPlayerFallback({ dataSaver }: { dataSaver: boolean }) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
  <View style={[styles.playerFallback, { backgroundColor: C.surfaceElevated }]}>
    <AppIcon name={dataSaver ? 'offline' : 'video'} color={C.textMuted} size={28} />
    <AppText variant="badge" tone="muted">{dataSaver ? 'PREVIEW OFF' : 'VIDEO UNAVAILABLE'}</AppText>
  </View>
  );
}

function ClipPage({ item, height, active }: { item: NewsCardItem; height: number; active: boolean }) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  const dataSaver = useProfileStore((state) => state.profile.dataSaver);
  const videoHeight = Math.min(height - 150, 420);
  return (
    <View style={[styles.clipPage, { height, backgroundColor: C.background }]}>
      <View style={[styles.clipFrame, { backgroundColor: C.secondary }]}>
        {item.videoId && !dataSaver ? (
          <YoutubePlayer
            height={videoHeight}
            play={active}
            videoId={item.videoId}
            initialPlayerParams={{ controls: true, modestbranding: true, rel: false }}
            webViewStyle={styles.youtubeWebView}
          />
        ) : item.thumbnailUrl && !dataSaver ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.clipImage} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <VideoPlayerFallback dataSaver={dataSaver} />
        )}
        <View style={[styles.clipOverlay, { backgroundColor: item.videoId && !dataSaver ? 'transparent' : C.overlay }]} pointerEvents="box-none">
          <View style={styles.clipTop}>
            <Badge label={item.duration || 'SHORT'} tone="video" />
            <IconButton label="Share clip" icon="share" />
          </View>
          {!item.videoId || dataSaver ? (
            <View style={styles.playCircle}>
              <AppIcon name="play" color={C.textInverse} size={40} />
            </View>
          ) : <View />}
          <View style={[styles.clipBottom, { backgroundColor: C.overlay }]}>
            <AppText variant="headline" tone="inverse" numberOfLines={2}>{item.title}</AppText>
            <AppText variant="caption" tone="inverse" numberOfLines={1} style={{ opacity: 0.78 }}>{item.channelName}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function VideoScreen() {
  const isDark = useResolvedColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { height } = useWindowDimensions();
  const pageHeight = Math.max(520, height - 210);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [featuredVideoId, setFeaturedVideoId] = useState<string | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 72 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const firstClip = viewableItems.find((token) => typeof token.index === 'number' && token.index >= 0);
    if (typeof firstClip?.index === 'number') setActiveClipIndex(firstClip.index);
  }).current;
  const query = useQuery({
    queryKey: ['video-tab-swipe'],
    queryFn: loadVideoTab,
    staleTime: 1000 * 60 * 4,
  });

  const clips = query.data?.clips || [];
  const longForm = query.data?.longForm || [];
  const featuredVideo = useMemo(() => {
    if (!featuredVideoId) return null;
    return longForm.find((item) => item.videoId === featuredVideoId) || null;
  }, [featuredVideoId, longForm]);

  const header = useMemo(() => (
    <View style={styles.header}>
      <AppText variant="screenTitle">Video</AppText>
      <AppText variant="body" tone="secondary">Watch inside JanSamachar. Swipe up for the next clip.</AppText>
      {query.data?.fallbackLabel ? (
        <View style={[styles.savedNotice, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
          <AppText variant="caption" tone="secondary">{query.data.fallbackLabel}</AppText>
        </View>
      ) : null}
      {featuredVideo?.videoId ? (
        <View style={[styles.featuredPlayer, { backgroundColor: C.card, borderColor: C.border }]}>
          <YoutubePlayer
            height={210}
            play
            videoId={featuredVideo.videoId}
            initialPlayerParams={{ controls: true, modestbranding: true, rel: false }}
          />
          <View style={styles.featuredBody}>
            <Badge label="Playing" tone="video" />
            <AppText variant="cardTitle" numberOfLines={2}>{featuredVideo.title}</AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>{featuredVideo.channelName}</AppText>
          </View>
        </View>
      ) : null}
      <SectionHeader title="Long-form and live" eyebrow={query.isFetching ? 'Refreshing' : 'YouTube sources'} />
      <FlatList
        horizontal
        data={longForm}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        renderItem={({ item }) => (
          <LongFormCard
            item={item}
            selected={Boolean(featuredVideoId && item.videoId === featuredVideoId)}
            onSelect={() => setFeaturedVideoId(item.videoId || null)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        contentContainerStyle={{ paddingRight: spacing.lg }}
      />
      <SectionHeader title="Short clips" eyebrow="Swipe vertically" />
    </View>
  ), [longForm, query.isFetching]);

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <FlatList
        data={clips}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        renderItem={({ item, index }) => <ClipPage item={item} height={pageHeight} active={index === activeClipIndex} />}
        pagingEnabled
        snapToInterval={pageHeight}
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
            colors={[C.coral]}
            tintColor={C.coral}
          />
        }
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingState label="Loading trusted videos..." />
          ) : (
            <EmptyState title="No videos available" message="Pull to refresh when video sources update." />
          )
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 104 },
  header: { padding: spacing.lg, gap: spacing.sm },
  longCard: { width: 270, borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  longThumb: { width: '100%', aspectRatio: 16 / 9 },
  fallbackThumb: { alignItems: 'center', justifyContent: 'center' },
  longBody: { padding: spacing.md, gap: spacing.sm },
  savedNotice: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  longTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  clipPage: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  clipFrame: { flex: 1, borderRadius: radius.card, overflow: 'hidden' },
  clipImage: { ...StyleSheet.absoluteFill },
  youtubeWebView: { backgroundColor: Colors.dark.bgPage },
  playerFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  clipOverlay: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  clipTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playCircle: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  clipBottom: { gap: spacing.xs, borderRadius: radius.control, padding: spacing.md, overflow: 'hidden' },
  featuredPlayer: { borderWidth: 1, borderRadius: radius.card, overflow: 'hidden' },
  featuredBody: { padding: spacing.md, gap: spacing.xs },
});
