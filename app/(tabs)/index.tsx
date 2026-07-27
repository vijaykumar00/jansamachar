import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { INTERESTS, PROFESSIONS } from '@/constants/professions';
import { radius, spacing } from '@/constants/theme';
import { type EngagementStory, useEngagementStore } from '@/store/engagementStore';
import { useProfileStore, useResolvedColorScheme } from '@/store/userProfileStore';
import { buildPersonalizedFeed, getGreeting, type FeedSection } from '@/services/personalizationService';
import { searchYouTubeNews } from '@/services/youtubeSearchService';
import { createFallbackMeta, fallbackLabel } from '@/services/fallbackService';
import AnimatedNewsCard, { type NewsCardItem, type NewsCardVariant } from '@/components/AnimatedNewsCard';
import {
  AppIcon,
  AppText,
  Chip,
  EmptyState,
  IconButton,
  JanSamacharLogo,
  Screen,
  SectionHeader,
  SkeletonBlock,
} from '@/components/ui/design-system';
import { openExternalUrl } from '@/services/linkService';

type FeedEntry = { type: 'story'; id: string; item: NewsCardItem; variant: NewsCardVariant };
type HomeFeedResult = {
  sections: FeedSection[];
  fetchedAt: string;
  isFallback: boolean;
  fallbackLabel?: string;
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'district', label: 'Local' },
  { id: 'state', label: 'State' },
  { id: 'national', label: 'India' },
  { id: 'profession', label: 'For you' },
  { id: 'interest', label: 'Interests' },
];

let lastSuccessfulHomeFeed: HomeFeedResult | null = null;

function formatRelative(dateStr?: string): string {
  if (!dateStr) return 'recently';
  const then = new Date(dateStr).getTime();
  if (!Number.isFinite(then)) return 'recently';
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function openStoredStory(story: EngagementStory) {
  if (story.videoId) {
    openExternalUrl(story.url || `https://www.youtube.com/watch?v=${story.videoId}`);
    return;
  }

  router.push({
    pathname: '/modal',
    params: {
      id: story.id,
      title: story.title,
      description: story.description || '',
      source: story.channelName,
      publishedAt: story.publishedAt,
      url: story.url || '',
      thumbnailUrl: story.thumbnailUrl || '',
      trustLevel: story.trustLevel,
      category: story.category || '',
      aiSummary: story.aiSummary || '',
    },
  });
}

function getStableStoryId(item: NewsCardItem, sectionId: string, index: number): string {
  const signature = [
    item.id,
    item.url,
    item.videoId,
    item.channelName,
    item.publishedAt,
    item.title,
    sectionId,
    index,
  ].filter(Boolean).join('|');

  let hash = 0;
  for (let i = 0; i < signature.length; i += 1) {
    hash = (hash * 31 + signature.charCodeAt(i)) >>> 0;
  }

  return `${sectionId}_${hash.toString(36)}_${index}`;
}

function normalizeSectionItems(sections: FeedSection[]): FeedSection[] {
  const seen = new Set<string>();

  return sections.map((section) => ({
    ...section,
    items: section.items.map((item, index) => {
      const stableId = getStableStoryId(item as NewsCardItem, section.id, index);
      const id = seen.has(stableId) ? `${stableId}_${seen.size}` : stableId;
      seen.add(id);
      return { ...item, id };
    }),
  }));
}

function flattenSections(sections: FeedSection[], filter: string): NewsCardItem[] {
  const filtered = sections.filter((section) => filter === 'all' || section.geoLevel === filter);
  const seen = new Set<string>();
  const items: NewsCardItem[] = [];

  filtered.forEach((section) => {
    section.items.forEach((item) => {
      const key = item.id || `${item.title}_${item.publishedAt}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push(item as NewsCardItem);
    });
  });

  return items;
}

function isBreakingStory(item: NewsCardItem): boolean {
  const raw = item as NewsCardItem & {
    isBreaking?: boolean;
    breaking?: boolean;
    is_breaking?: boolean;
  };
  return Boolean(
    raw.isBreaking ||
    raw.breaking ||
    raw.is_breaking ||
    item.trustLevel === 'breaking' ||
    item.category === 'breaking'
  );
}

function isVideoStory(item: NewsCardItem): boolean {
  return Boolean(item.videoId || item.source === 'youtube');
}

function isLocalStory(item: NewsCardItem): boolean {
  return item.category === 'state' || item.source === 'citizen';
}

function buildMixedEntries(items: NewsCardItem[], hasLocation: boolean): FeedEntry[] {
  const articleItems = items.filter((item) => !isVideoStory(item) && !isLocalStory(item));
  const videoItems = items.filter(isVideoStory);
  const localItems = items.filter((item) => isLocalStory(item));
  const entries: FeedEntry[] = [];
  let videoIndex = 0;
  let localIndex = 0;

  articleItems.forEach((item, index) => {
    if ((index + 1) % 6 === 0 && videoItems[videoIndex]) {
      const video = videoItems[videoIndex];
      entries.push({ type: 'story', id: `video_${video.id}_${videoIndex}`, item: video, variant: 'video' });
      videoIndex += 1;
    }

    if (hasLocation && (index + 1) % 8 === 0 && localItems[localIndex]) {
      const local = localItems[localIndex];
      entries.push({ type: 'story', id: `local_${local.id}_${localIndex}`, item: local, variant: 'local' });
      localIndex += 1;
    }

    entries.push({ type: 'story', id: `article_${item.id}_${index}`, item, variant: 'article' });
  });

  while (entries.length < 12 && videoItems[videoIndex]) {
    const video = videoItems[videoIndex];
    entries.push({ type: 'story', id: `video_tail_${video.id}_${videoIndex}`, item: video, variant: 'video' });
    videoIndex += 1;
  }

  return entries;
}

async function loadHomeFeed(profile: ReturnType<typeof useProfileStore.getState>['profile']): Promise<HomeFeedResult> {
  try {
    const [sections, breakingVideos] = await Promise.all([
      buildPersonalizedFeed(profile),
      searchYouTubeNews('India breaking news today', 5),
    ]);
    const hasStories = sections.some((section) => section.items.length > 0);
    const normalizedSections = normalizeSectionItems(sections);
    const breakingItems = breakingVideos.map((item) => ({
      id: `breaking_${item.videoId}`,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      channelName: item.channelName,
      publishedAt: item.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
      videoId: item.videoId,
      source: 'youtube',
      trustLevel: 'breaking',
      category: 'breaking',
    })) as NewsCardItem[];
    const hasAnyStories = hasStories || breakingItems.length > 0;

    const result: HomeFeedResult = {
      sections: normalizeSectionItems([
        { id: 'breaking', title: 'Breaking', titleHi: 'Breaking', emoji: '!', items: breakingItems as any, geoLevel: 'national' },
        ...normalizedSections,
      ].filter((section) => section.items.length > 0) as FeedSection[]),
      fetchedAt: new Date().toISOString(),
      isFallback: !hasAnyStories,
      fallbackLabel: !hasAnyStories ? fallbackLabel(createFallbackMeta('empty_response', 'home feed')) : undefined,
    };

    if (hasAnyStories) lastSuccessfulHomeFeed = result;
    return result;
  } catch {
    const saved = lastSuccessfulHomeFeed;
    if (saved) {
      return {
        ...saved,
        isFallback: true,
        fallbackLabel: fallbackLabel({ reason: 'last_success', fetchedAt: saved.fetchedAt }),
      };
    }

    const fetchedAt = new Date().toISOString();
    return {
      sections: [],
      fetchedAt,
      isFallback: true,
      fallbackLabel: fallbackLabel({ reason: 'provider_error', provider: 'home feed', fetchedAt }),
    };
  }
}

function BreakingBand({ item, onDismiss }: { item: NewsCardItem; onDismiss: () => void }) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={[styles.breakingBand, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.coral }]}>
      <View style={styles.breakingText}>
        <AppText variant="badge" tone="danger">BREAKING</AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>{item.title}</AppText>
      </View>
      <IconButton label="Dismiss breaking news" icon="close" onPress={onDismiss} style={styles.dismissButton} />
    </View>
  );
}

function RefreshIndicator({ visible }: { visible: boolean }) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  if (!visible) return null;

  return (
    <View style={[styles.refreshIndicator, { borderColor: C.coral, backgroundColor: C.surface }]}>
      <View style={[styles.refreshDot, { backgroundColor: C.coral }]} />
      <AppText variant="caption" tone="secondary">Refreshing latest stories</AppText>
    </View>
  );
}

function HomeSkeletonList() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <SkeletonBlock height={190} borderRadius={radius.card} />
          <SkeletonBlock height={170} borderRadius={radius.card} />
        </View>
      ))}
    </View>
  );
}

function ReturnUserStrip({ items, mode }: { items: EngagementStory[]; mode: 'history' | 'saved' }) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  if (items.length === 0) return null;

  return (
    <>
      <SectionHeader
        title={mode === 'history' ? 'Continue Reading' : 'Saved For Later'}
        eyebrow={mode === 'history' ? 'Pick up recent stories' : 'Your bookmarks on this device'}
      />
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
            onPress={() => openStoredStory(item)}
            style={({ pressed }) => [
              styles.returnCard,
              { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.84 : 1 },
            ]}
          >
            <View style={[styles.returnIcon, { backgroundColor: C.surfaceElevated }]}>
              <AppIcon name={item.videoId ? 'video' : mode === 'saved' ? 'save' : 'history'} color={C.coral} size={20} />
            </View>
            <AppText variant="bodyStrong" numberOfLines={2}>{item.title}</AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {item.channelName} - {mode === 'history' ? formatRelative(item.viewedAt) : formatRelative(item.savedAt)}
            </AppText>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        contentContainerStyle={styles.returnList}
      />
    </>
  );
}

export default function HomeScreen() {
  const isDark = useResolvedColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { width } = useWindowDimensions();
  const { profile, isLoaded } = useProfileStore();
  const historyItems = useEngagementStore((state) => state.historyItems);
  const savedItems = useEngagementStore((state) => state.savedItems);
  const [filter, setFilter] = useState('all');
  const [breakingDismissed, setBreakingDismissed] = useState(false);
  const profession = PROFESSIONS.find((item) => item.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];
  const selectedInterests = INTERESTS.filter((interest) => profile.interests.includes(interest.id)).slice(0, 3);
  const hasLocation = Boolean(profile.stateName && profile.districtName);
  const cardInterval = Math.max(172, width / 2.2);

  const query = useQuery({
    queryKey: ['home-feed', profile.stateName, profile.districtName, profile.profession, profile.interests.join(','), profile.language],
    queryFn: () => loadHomeFeed(profile),
    enabled: isLoaded,
    staleTime: 1000 * 60 * 5,
  });

  const flatItems = useMemo(
    () => flattenSections(query.data?.sections || [], filter),
    [filter, query.data?.sections]
  );
  const breakingItem = useMemo(
    () => flatItems.find(isBreakingStory),
    [flatItems]
  );
  const topStories = useMemo(
    () => flatItems.filter((item) => !isVideoStory(item)).slice(0, 8),
    [flatItems]
  );
  const entries = useMemo(
    () => buildMixedEntries(flatItems.filter((item) => !isBreakingStory(item)), hasLocation),
    [flatItems, hasLocation]
  );
  const returnItems = historyItems.length > 0 ? historyItems.slice(0, 5) : savedItems.slice(0, 5);
  const returnMode = historyItems.length > 0 ? 'history' : 'saved';

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <FlatList
        data={entries}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
            colors={[C.coral]}
            tintColor={C.coral}
            progressBackgroundColor={C.surface}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.headerTop}>
              <JanSamacharLogo compact />
              <View style={styles.headerActions}>
                <IconButton label="Search news" icon="search" onPress={() => router.push('/search')} />
                <IconButton label="Refresh feed" icon="refresh" onPress={() => query.refetch()} />
              </View>
            </View>

            {!breakingDismissed && breakingItem ? (
              <BreakingBand item={breakingItem} onDismiss={() => setBreakingDismissed(true)} />
            ) : null}

            {query.data?.fallbackLabel ? (
              <View style={[styles.savedNotice, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
                <AppText variant="caption" tone="secondary">{query.data.fallbackLabel}</AppText>
              </View>
            ) : null}

            <RefreshIndicator visible={query.isRefetching && !query.isLoading} />

            <View style={[styles.hero, { backgroundColor: C.secondary }]}>
              <AppText variant="caption" tone="inverse">{getGreeting()} - {profile.districtName}, {profile.stateName}</AppText>
              <AppText variant="display" tone="inverse">News that matters to you</AppText>
              <AppText variant="body" tone="inverse" style={{ opacity: 0.76 }}>
                Built around your location, profession, language, and trusted sources.
              </AppText>
              <View style={styles.profilePills}>
                <View style={[styles.profilePill, { backgroundColor: C.coral }]}>
                  <AppText variant="badge" tone="inverse">{profession.emoji} {profession.label}</AppText>
                </View>
                {selectedInterests.map((interest) => (
                  <View key={interest.id} style={[styles.profilePill, { backgroundColor: C.primaryDark }]}>
                    <AppText variant="badge" tone="inverse">{interest.label}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <ReturnUserStrip items={returnItems} mode={returnMode} />

            <View style={styles.filterRow}>
              <FlatList
                horizontal
                data={FILTERS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Chip label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} compact />
                )}
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
              />
            </View>

            {topStories.length > 0 ? (
              <>
                <SectionHeader title="Top Stories" eyebrow="Latest verified updates" />
                <FlatList
                  horizontal
                  data={topStories}
                  keyExtractor={(item, index) => `top_${item.id}_${index}`}
                  renderItem={({ item, index }) => (
                    <View style={{ width: cardInterval }}>
                      <AnimatedNewsCard item={item} index={index} variant="article" />
                    </View>
                  )}
                  snapToInterval={cardInterval}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.topStoriesContent}
                />
              </>
            ) : null}

            <SectionHeader title="Your Feed" eyebrow="Articles, video, and local signal" />
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedNewsCard item={item.item} index={index} variant={item.variant} />
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <HomeSkeletonList />
          ) : (
            <EmptyState
              title="No stories found"
              message="Pull to refresh, change a filter, or check your connection."
              actionLabel="Retry"
              onAction={() => query.refetch()}
            />
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 104 },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  breakingBand: {
    minHeight: 42,
    borderRadius: radius.control,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakingText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dismissButton: { width: 48, height: 48, minWidth: 48, minHeight: 48, borderRadius: radius.control },
  savedNotice: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  refreshIndicator: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshDot: { width: 8, height: 8, borderRadius: 4 },
  hero: {
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  profilePills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  profilePill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  returnList: { paddingRight: spacing.lg },
  returnCard: {
    width: 230,
    minHeight: 126,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  returnIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filterRow: { marginTop: spacing.lg },
  topStoriesContent: { paddingRight: spacing.lg },
  skeletonList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  skeletonCard: {
    borderRadius: radius.card,
    overflow: 'hidden',
    gap: 0,
  },
});
