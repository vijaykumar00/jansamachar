import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { INTERESTS, PROFESSIONS } from '@/constants/professions';
import { spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/userProfileStore';
import { buildPersonalizedFeed, getGreeting, type FeedSection } from '@/services/personalizationService';
import { searchYouTubeNews } from '@/services/youtubeSearchService';
import { MOCK_NEWS_ITEMS } from '@/services/mockData';
import AnimatedNewsCard, { type NewsCardItem } from '@/components/AnimatedNewsCard';
import {
  AppText,
  Chip,
  EmptyState,
  IconButton,
  JanSamacharLogo,
  LoadingState,
  Screen,
  SectionHeader,
} from '@/components/ui/design-system';

type FeedEntry =
  | { type: 'section'; id: string; title: string; eyebrow: string }
  | { type: 'story'; id: string; item: NewsCardItem; featured?: boolean };

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'district', label: 'Local' },
  { id: 'state', label: 'State' },
  { id: 'national', label: 'India' },
  { id: 'profession', label: 'For you' },
  { id: 'interest', label: 'Interests' },
];

function toFallbackSections(): FeedSection[] {
  return [
    {
      id: 'national',
      title: 'Top stories',
      titleHi: 'आज की बड़ी खबरें',
      emoji: 'IN',
      items: MOCK_NEWS_ITEMS,
      geoLevel: 'national',
    },
  ];
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

async function loadHomeFeed(profile: ReturnType<typeof useProfileStore.getState>['profile']) {
  const [sections, breaking] = await Promise.all([
    buildPersonalizedFeed(profile),
    searchYouTubeNews('India breaking news today', 5),
  ]);
  const hasStories = sections.some((section) => section.items.length > 0);
  return {
    sections: normalizeSectionItems(hasStories ? sections : toFallbackSections()),
    breaking: breaking.map((item) => item.title).filter(Boolean),
  };
}

function BreakingTicker({ items }: { items: string[] }) {
  const C = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  const fallback = MOCK_NEWS_ITEMS.slice(0, 3).map((item) => item.title);
  const headlines = items.length > 0 ? items : fallback;

  return (
    <View style={[styles.breaking, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.liveDot, { backgroundColor: C.live }]} />
      <AppText variant="badge" tone="danger">BREAKING</AppText>
      <AppText variant="caption" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
        {headlines[0]}
      </AppText>
    </View>
  );
}

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { profile, isLoaded } = useProfileStore();
  const [filter, setFilter] = useState('all');
  const profession = PROFESSIONS.find((item) => item.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];
  const selectedInterests = INTERESTS.filter((interest) => profile.interests.includes(interest.id)).slice(0, 3);

  const query = useQuery({
    queryKey: ['home-feed', profile.stateName, profile.districtName, profile.profession, profile.interests.join(','), profile.language],
    queryFn: () => loadHomeFeed(profile),
    enabled: isLoaded,
    staleTime: 1000 * 60 * 5,
  });

  const entries = useMemo<FeedEntry[]>(() => {
    const sections = (query.data?.sections || []).filter(
      (section) => filter === 'all' || section.geoLevel === filter
    );
    const output: FeedEntry[] = [];

    sections.forEach((section) => {
      const items = section.items.filter(Boolean) as NewsCardItem[];
      if (items.length === 0) return;
      output.push({ type: 'section', id: `header_${section.id}`, title: section.titleHi, eyebrow: section.title });
      items.slice(0, 8).forEach((item, index) => {
        output.push({ type: 'story', id: `${section.id}_${item.id}_${index}`, item, featured: output.length < 3 });
      });
    });

    return output;
  }, [filter, query.data?.sections]);

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
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.headerTop}>
              <JanSamacharLogo compact />
              <View style={styles.headerActions}>
                <IconButton label="Search news" icon="Q" onPress={() => router.push('/search')} />
                <IconButton label="Refresh feed" icon="!" onPress={() => query.refetch()} />
              </View>
            </View>
            <View style={[styles.hero, { backgroundColor: C.secondary }]}>
              <AppText variant="caption" tone="inverse">{getGreeting()} • {profile.districtName}, {profile.stateName}</AppText>
              <AppText variant="display" tone="inverse">News that matters to you</AppText>
              <AppText variant="body" tone="inverse" style={{ opacity: 0.76 }}>
                Built around your location, profession, language, and trusted sources.
              </AppText>
              <View style={styles.profilePills}>
                <View style={[styles.profilePill, { backgroundColor: C.primary }]}>
                  <AppText variant="badge" tone="inverse">{profession.emoji} {profession.label}</AppText>
                </View>
                {selectedInterests.map((interest) => (
                  <View key={interest.id} style={[styles.profilePill, { backgroundColor: C.accent }]}>
                    <AppText variant="badge" tone="inverse">{interest.label}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <BreakingTicker items={query.data?.breaking || []} />

            <View style={styles.filterRow}>
              <FlatList
                horizontal
                data={FILTERS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Chip label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} />
                )}
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
              />
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          if (item.type === 'section') {
            return <SectionHeader title={item.title} eyebrow={item.eyebrow} />;
          }
          return (
            <AnimatedNewsCard
              item={item.item}
              index={index}
              featured={item.featured}
              variant={item.item.videoId || item.item.source === 'youtube' ? 'video' : item.item.category === 'state' ? 'local' : 'article'}
            />
          );
        }}
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingState label={`${profile.districtName} news is loading...`} />
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
  hero: {
    borderRadius: 22,
    padding: spacing.xl,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  profilePills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  profilePill: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  breaking: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  filterRow: { marginTop: spacing.lg },
});
