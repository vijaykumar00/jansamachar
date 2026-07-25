import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import { MOCK_LIVE_STREAMS, MOCK_NEWS_ITEMS } from '@/services/mockData';
import { getActiveLiveStreamCards, type LiveStreamCard } from '@/services/supabaseService';
import { searchYouTubeNews, ytSearchToNewsItem } from '@/services/youtubeSearchService';
import AnimatedNewsCard, { type NewsCardItem } from '@/components/AnimatedNewsCard';
import {
  AppButton,
  AppText,
  Badge,
  Chip,
  EmptyState,
  IconButton,
  LoadingState,
  Screen,
  SectionHeader,
} from '@/components/ui/design-system';

const FILTERS = ['All', 'Live', 'Explainers', 'Fact checks', 'Ground reports'];

function formatViewers(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

async function loadVideoTab() {
  const [streams, videos] = await Promise.allSettled([
    getActiveLiveStreamCards(),
    searchYouTubeNews('India news explainers live fact check ground report', 14),
  ]);

  const liveStreams = streams.status === 'fulfilled' && streams.value.length > 0
    ? streams.value
    : MOCK_LIVE_STREAMS.map((stream): LiveStreamCard => ({
        id: stream.id,
        title: stream.title,
        streamer: stream.streamer,
        viewers: stream.viewers,
        thumbnail: stream.thumbnail,
        isLive: stream.isLive,
        hasDoc: stream.hasDoc,
        startedAt: stream.startedAt,
        category: stream.category,
      }));

  const liveVideos = videos.status === 'fulfilled' ? videos.value.map(ytSearchToNewsItem) : [];
  const fallbackVideos = MOCK_NEWS_ITEMS.filter((item) => item.videoId || item.source === 'youtube');

  return {
    streams: liveStreams,
    videos: liveVideos.length > 0 ? liveVideos : fallbackVideos,
  };
}

function matchesFilter(item: NewsCardItem, filter: string) {
  if (filter === 'All') return true;
  if (filter === 'Live') return item.source === 'youtube';
  if (filter === 'Fact checks') return item.category === 'fact_check' || item.channelName.toLowerCase().includes('fact');
  if (filter === 'Ground reports') return item.category === 'state' || item.channelName.toLowerCase().includes('ground');
  return item.title.toLowerCase().includes('explainer') || item.category === 'technology';
}

export default function VideoScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const [filter, setFilter] = useState('All');
  const query = useQuery({
    queryKey: ['video-tab'],
    queryFn: loadVideoTab,
    staleTime: 1000 * 60 * 4,
  });

  const videos = useMemo(
    () => (query.data?.videos || []).filter((item) => matchesFilter(item, filter)),
    [filter, query.data?.videos]
  );
  const featured = videos[0] || MOCK_NEWS_ITEMS.find((item) => item.videoId) || MOCK_NEWS_ITEMS[0];
  const streams = query.data?.streams || [];

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <FlatList
        data={videos.slice(1)}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.player, { backgroundColor: C.secondary }]}>
              {featured.thumbnailUrl ? (
                <Image
                  source={{ uri: featured.thumbnailUrl }}
                  style={styles.playerImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={180}
                />
              ) : null}
              <View style={[styles.playerOverlay, { backgroundColor: C.overlay }]}>
                <View style={styles.playerTop}>
                  <Badge label="Featured video" tone="video" icon="VID" />
                  <IconButton label="Share featured video" icon=">" />
                </View>
                <View style={styles.playerBottom}>
                  <AppText variant="screenTitle" tone="inverse" numberOfLines={2}>{featured.title}</AppText>
                  <AppText variant="caption" tone="inverse" style={{ opacity: 0.78 }}>
                    {featured.channelName} - sound starts only after play
                  </AppText>
                  <AppButton
                    label="Watch now"
                    icon="PLAY"
                    onPress={() => Linking.openURL(featured.url || 'https://youtube.com')}
                    style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((item) => (
                <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} compact />
              ))}
            </View>

            <SectionHeader title="Live channels" eyebrow="Supabase realtime when configured" />
            <View style={styles.liveStack}>
              {streams.map((stream) => (
                <Pressable
                  key={stream.id}
                  accessibilityRole="button"
                  onPress={() => Alert.alert('Live stream', stream.agoraChannel ? `Agora channel: ${stream.agoraChannel}` : 'Live playback activates when streaming is configured.')}
                  style={({ pressed }) => [
                    styles.liveCard,
                    { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.88 : 1 },
                  ]}
                >
                  {stream.thumbnail ? (
                    <Image source={{ uri: stream.thumbnail }} style={styles.liveThumb} contentFit="cover" cachePolicy="memory-disk" />
                  ) : (
                    <View style={[styles.liveThumb, styles.liveFallback, { backgroundColor: C.surfaceElevated }]}>
                      <AppText variant="badge" tone="muted">LIVE</AppText>
                    </View>
                  )}
                  <View style={styles.liveText}>
                    <View style={styles.cardTop}>
                      <Badge label="LIVE" tone="live" />
                      <AppText variant="caption" tone="muted">{formatViewers(stream.viewers)} watching</AppText>
                    </View>
                    <AppText variant="cardTitle" numberOfLines={2}>{stream.title}</AppText>
                    <AppText variant="caption" tone="muted">{stream.streamer}</AppText>
                  </View>
                </Pressable>
              ))}
            </View>

            <SectionHeader title="Latest videos" eyebrow={query.isFetching ? 'Refreshing trusted channels' : 'Trusted channels'} />
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedNewsCard item={item} index={index} variant="video" />
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingState label="Loading trusted videos..." />
          ) : (
            <EmptyState title="No videos available" message="Try another filter or pull to refresh." />
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
  header: { padding: spacing.lg },
  player: { borderRadius: 22, overflow: 'hidden', minHeight: 320 },
  playerImage: { ...StyleSheet.absoluteFill },
  playerOverlay: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  playerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerBottom: { gap: spacing.xs },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  liveStack: { gap: spacing.md },
  liveCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  liveThumb: { width: 118, minHeight: 112 },
  liveFallback: { alignItems: 'center', justifyContent: 'center' },
  liveText: { flex: 1, padding: spacing.md, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
