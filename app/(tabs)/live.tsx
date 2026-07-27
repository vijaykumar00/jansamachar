import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { createFallbackMeta, fallbackLabel } from '@/services/fallbackService';
import { openExternalUrl } from '@/services/linkService';
import { searchYouTubeNews, ytSearchToNewsItem } from '@/services/youtubeSearchService';
import { AppIcon, AppText, Badge, EmptyState, IconButton, LoadingState, Screen, SectionHeader } from '@/components/ui/design-system';
import { useProfileStore, useResolvedColorScheme } from '@/store/userProfileStore';
import type { NewsCardItem } from '@/components/AnimatedNewsCard';

type LongFormItem = {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  url: string;
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
      url: item.url || 'https://youtube.com',
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

function LongFormCard({ item }: { item: LongFormItem }) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  const dataSaver = useProfileStore((state) => state.profile.dataSaver);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openExternalUrl(item.url)}
      style={({ pressed }) => [
        styles.longCard,
        { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.88 : 1 },
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

function ClipPage({ item, height }: { item: NewsCardItem; height: number }) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  const dataSaver = useProfileStore((state) => state.profile.dataSaver);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openExternalUrl(item.url || 'https://youtube.com')}
      style={[styles.clipPage, { height, backgroundColor: C.background }]}
    >
      <View style={[styles.clipFrame, { backgroundColor: C.secondary }]}>
        {item.thumbnailUrl && !dataSaver ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.clipImage} contentFit="cover" cachePolicy="memory-disk" />
        ) : null}
        <View style={[styles.clipOverlay, { backgroundColor: C.overlay }]}>
          <View style={styles.clipTop}>
            <Badge label={item.duration || 'SHORT'} tone="video" />
            <IconButton label="Share clip" icon="share" />
          </View>
          <View style={styles.playCircle}>
            <AppIcon name="play" color={C.textInverse} size={40} />
          </View>
          <View style={styles.clipBottom}>
            <AppText variant="headline" tone="inverse" numberOfLines={2}>{item.title}</AppText>
            <AppText variant="caption" tone="inverse" numberOfLines={1} style={{ opacity: 0.78 }}>{item.channelName}</AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function VideoScreen() {
  const isDark = useResolvedColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { height } = useWindowDimensions();
  const pageHeight = Math.max(520, height - 210);
  const query = useQuery({
    queryKey: ['video-tab-swipe'],
    queryFn: loadVideoTab,
    staleTime: 1000 * 60 * 4,
  });

  const clips = query.data?.clips || [];
  const longForm = query.data?.longForm || [];

  const header = useMemo(() => (
    <View style={styles.header}>
      <AppText variant="screenTitle">Video</AppText>
      <AppText variant="body" tone="secondary">Swipe clips vertically. Long-form and live streams stay up top.</AppText>
      {query.data?.fallbackLabel ? (
        <View style={[styles.savedNotice, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
          <AppText variant="caption" tone="secondary">{query.data.fallbackLabel}</AppText>
        </View>
      ) : null}
      <SectionHeader title="Long-form and live" eyebrow={query.isFetching ? 'Refreshing' : 'YouTube sources'} />
      <FlatList
        horizontal
        data={longForm}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        renderItem={({ item }) => <LongFormCard item={item} />}
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
        renderItem={({ item }) => <ClipPage item={item} height={pageHeight} />}
        pagingEnabled
        snapToInterval={pageHeight}
        decelerationRate="fast"
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
  clipOverlay: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  clipTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playCircle: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  clipBottom: { gap: spacing.xs },
});
