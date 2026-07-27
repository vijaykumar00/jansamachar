import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { INTERESTS } from '@/constants/professions';
import { TRUSTED_YOUTUBE_CHANNELS } from '@/constants/sources';
import { radius, spacing } from '@/constants/theme';
import { useProfileStore, useResolvedColorScheme } from '@/store/userProfileStore';
import { fetchNewsByQuery, toNewsItem } from '@/services/newsDataService';
import { MOCK_NEWS_ITEMS } from '@/services/mockData';
import { openExternalUrl } from '@/services/linkService';
import { searchYouTubeNews, ytSearchToNewsItem } from '@/services/youtubeSearchService';
import AnimatedNewsCard, { type NewsCardItem } from '@/components/AnimatedNewsCard';
import { AppButton, AppText, Badge, Chip, EmptyState, LoadingState, Screen, SearchField, SectionHeader } from '@/components/ui/design-system';

const TRENDING_SEARCHES = ['Supreme Court', 'Monsoon', 'MSP', 'GST', 'UPSC', 'Delhi AQI', 'Fact check'];
const RESULT_TABS = ['Articles', 'Videos', 'Topics', 'Publishers'] as const;

type ResultTab = (typeof RESULT_TABS)[number];
type ExploreRow =
  | { type: 'current-affairs'; id: string; articles: NewsCardItem[] }
  | { type: 'topic'; id: string; title: string; source: string; topicId: string }
  | { type: 'story'; id: string; item: NewsCardItem; variant: 'article' | 'video' | 'local' }
  | { type: 'publisher'; id: string; name: string; handle: string; kind: string; language: string };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function loadSearchResults(query: string) {
  const [articles, videos] = await Promise.allSettled([
    fetchNewsByQuery(query, 'hi,en', 10),
    searchYouTubeNews(`${query} India news`, 8),
  ]);

  const liveStories = articles.status === 'fulfilled' ? articles.value.map(toNewsItem) : [];
  const liveVideos = videos.status === 'fulfilled' ? videos.value.map(ytSearchToNewsItem) : [];
  const fallback = MOCK_NEWS_ITEMS.filter((item) => {
    const haystack = `${item.title} ${item.channelName} ${item.description} ${item.category}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const usingFallback = liveStories.length === 0 && liveVideos.length === 0;

  return {
    articles: liveStories.length > 0 ? liveStories : fallback.filter((item) => item.source !== 'youtube'),
    videos: liveVideos.length > 0 ? liveVideos : fallback.filter((item) => item.source === 'youtube' || item.videoId),
    fallbackLabel: usingFallback ? `Showing offline fallback from ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : '',
  };
}

async function loadCurrentAffairs() {
  const articles = await fetchNewsByQuery('current affairs UPSC India today', 'hi,en', 6);
  const mapped = articles.map(toNewsItem);
  return mapped.length > 0
    ? mapped
    : MOCK_NEWS_ITEMS.filter((item) => ['politics', 'economy', 'accountability', 'fact_check'].includes(item.category || '')).slice(0, 4);
}

export default function SearchScreen() {
  const isDark = useResolvedColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { profile } = useProfileStore();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [tab, setTab] = useState<ResultTab>('Articles');
  const trimmedQuery = query.trim();
  const isExamPrepUser = profile.profession === 'student' || profile.interests.some((id) => ['education', 'courts', 'economy'].includes(id));

  const resultsQuery = useQuery({
    queryKey: ['explore-search', trimmedQuery],
    queryFn: () => loadSearchResults(trimmedQuery),
    enabled: trimmedQuery.length > 1,
    staleTime: 1000 * 60 * 5,
  });

  const currentAffairsQuery = useQuery({
    queryKey: ['current-affairs', todayKey(), profile.language],
    queryFn: loadCurrentAffairs,
    enabled: isExamPrepUser,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const topicRows = useMemo(() => {
    const selectedTopics = topic === 'all' ? INTERESTS.slice(0, 12) : INTERESTS.filter((item) => item.id === topic);
    return selectedTopics.map((item): ExploreRow => ({
      type: 'topic',
      id: `topic_${item.id}`,
      topicId: item.id,
      title: item.label,
      source: item.keywords[0],
    }));
  }, [topic]);

  const publisherRows = useMemo(() => {
    const needle = trimmedQuery.toLowerCase();
    return TRUSTED_YOUTUBE_CHANNELS.filter((source) => {
      if (!needle) return true;
      const haystack = `${source.name} ${source.handle} ${source.type} ${source.language}`.toLowerCase();
      return haystack.includes(needle);
    }).slice(0, 10).map((source): ExploreRow => ({
      type: 'publisher',
      id: source.id,
      name: source.name,
      handle: source.handle,
      kind: source.type.replace('_', ' '),
      language: source.language,
    }));
  }, [trimmedQuery]);

  const rows = useMemo<ExploreRow[]>(() => {
    if (trimmedQuery.length <= 1) {
      return [
        ...(isExamPrepUser ? [{ type: 'current-affairs' as const, id: 'current-affairs', articles: currentAffairsQuery.data || [] }] : []),
        ...topicRows,
        ...publisherRows.slice(0, 6),
      ];
    }

    if (tab === 'Topics') return topicRows;
    if (tab === 'Publishers') return publisherRows;

    const items = tab === 'Videos' ? resultsQuery.data?.videos || [] : resultsQuery.data?.articles || [];
    return items.map((item, index): ExploreRow => ({
      type: 'story',
      id: `${tab.toLowerCase()}_${item.id}_${index}`,
      item,
      variant: tab === 'Videos' ? 'video' : item.category === 'state' ? 'local' : 'article',
    }));
  }, [currentAffairsQuery.data, isExamPrepUser, publisherRows, resultsQuery.data, tab, topicRows, trimmedQuery.length]);

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <FlatList
        data={rows}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="screenTitle">Explore</AppText>
            <AppText variant="body" tone="secondary">
              Search articles, clips, topics, and trusted publishers.
            </AppText>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Search news, source, topic..."
              returnKeyType="search"
              autoCapitalize="none"
            />

            <SectionHeader title="Trending" />
            <View style={styles.trendingList}>
              {TRENDING_SEARCHES.map((term, index) => (
                <Pressable
                  key={term}
                  accessibilityRole="button"
                  onPress={() => setQuery(term)}
                  style={({ pressed }) => [
                    styles.trendingRow,
                    { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.86 : 1 },
                  ]}
                >
                  <AppText variant="badge" tone="muted">{index + 1}</AppText>
                  <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{term}</AppText>
                  <Badge label="Trending" tone="topic" />
                </Pressable>
              ))}
            </View>

            <SectionHeader title="Topics" eyebrow="Tap to search" />
            <View style={styles.chipWrap}>
              <Chip label="All" selected={topic === 'all'} onPress={() => setTopic('all')} compact />
              {INTERESTS.slice(0, 10).map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  icon={item.emoji}
                  selected={topic === item.id}
                  onPress={() => {
                    setTopic(item.id);
                    setQuery(item.keywords[0]);
                  }}
                  compact
                />
              ))}
            </View>

            <View style={styles.chipWrap}>
              {RESULT_TABS.map((item) => (
                <Chip key={item} label={item} selected={tab === item} onPress={() => setTab(item)} compact />
              ))}
            </View>

            {trimmedQuery.length > 1 ? (
              <SectionHeader
                title={`${tab} results`}
                eyebrow={resultsQuery.isFetching ? 'Refreshing' : `For "${trimmedQuery}"`}
              />
            ) : (
              <SectionHeader title={isExamPrepUser ? 'For Your Preparation' : 'Browse'} eyebrow={isExamPrepUser ? 'Auto-refreshes daily' : 'Start with a trend or topic'} />
            )}
            {resultsQuery.data?.fallbackLabel ? (
              <View style={[styles.savedNotice, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
                <AppText variant="caption" tone="secondary">{resultsQuery.data.fallbackLabel}</AppText>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => {
          if (item.type === 'current-affairs') {
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => setQuery('current affairs UPSC India today')}
                style={({ pressed }) => [
                  styles.collectionCard,
                  { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <View style={styles.collectionTop}>
                  <Badge label="Daily" tone="verified" />
                  <AppText variant="caption" tone="muted">{todayKey()}</AppText>
                </View>
                <AppText variant="headline">Current Affairs</AppText>
                <AppText variant="body" tone="secondary" numberOfLines={2}>
                  Exam-focused headlines across policy, economy, courts, science, and governance.
                </AppText>
                <View style={styles.collectionLinks}>
                  {(item.articles.length > 0 ? item.articles : MOCK_NEWS_ITEMS.slice(0, 3)).slice(0, 3).map((story) => (
                    <AppText key={story.id} variant="caption" tone="muted" numberOfLines={1}>- {story.title}</AppText>
                  ))}
                </View>
              </Pressable>
            );
          }

          if (item.type === 'story') {
            return <AnimatedNewsCard item={item.item} index={index} variant={item.variant} />;
          }

          if (item.type === 'publisher') {
            return (
              <Pressable
                accessibilityRole="link"
                onPress={() => openExternalUrl(`https://www.youtube.com/${item.handle}`)}
                style={({ pressed }) => [
                  styles.rowCard,
                  { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.86 : 1 },
                ]}
              >
                <View style={[styles.sourceMark, { backgroundColor: C.live + '18' }]}>
                  <AppText variant="badge" tone="danger">VID</AppText>
                </View>
                <View style={styles.rowText}>
                  <AppText variant="cardTitle">{item.name}</AppText>
                  <AppText variant="caption" tone="muted">{item.handle} - {item.kind} - {item.language.toUpperCase()}</AppText>
                </View>
                <Badge tone="verified" />
              </Pressable>
            );
          }

          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => setQuery(item.source)}
              style={({ pressed }) => [
                styles.rowCard,
                { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.86 : 1 },
              ]}
            >
              <View style={styles.rowText}>
                <AppText variant="cardTitle" numberOfLines={2}>{item.title}</AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>{item.source}</AppText>
              </View>
              <Badge label="Topic" tone="topic" />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          resultsQuery.isLoading ? (
            <LoadingState label="Searching trusted feeds..." />
          ) : trimmedQuery.length > 1 ? (
            <EmptyState title="No search results" message="Try a source name, topic, city, or simpler keyword." />
          ) : null
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 104 },
  header: { padding: spacing.lg, gap: spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  trendingList: { gap: spacing.sm },
  trendingRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  collectionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  collectionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  collectionLinks: { gap: spacing.xs, marginTop: spacing.xs },
  savedNotice: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sourceMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
});
