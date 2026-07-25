import React, { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { INTERESTS } from '@/constants/professions';
import { TRUSTED_YOUTUBE_CHANNELS } from '@/constants/sources';
import { spacing } from '@/constants/theme';
import { fetchNewsByQuery, toNewsItem } from '@/services/newsDataService';
import { MOCK_NEWS_ITEMS } from '@/services/mockData';
import { searchYouTubeNews, ytSearchToNewsItem } from '@/services/youtubeSearchService';
import AnimatedNewsCard, { type NewsCardItem } from '@/components/AnimatedNewsCard';
import { AppText, Badge, Chip, EmptyState, LoadingState, Screen, SearchField, SectionHeader } from '@/components/ui/design-system';

const QUICK_SEARCHES = ['Supreme Court', 'Monsoon', 'MSP', 'GST', 'UPSC', 'Delhi AQI', 'Fact check'];
const TABS = ['All', 'Stories', 'Videos', 'Sources', 'Fact checks'] as const;

type SearchTab = (typeof TABS)[number];
type ExploreRow =
  | { type: 'section'; id: string; title: string; eyebrow?: string }
  | { type: 'topic'; id: string; title: string; source: string; topicId: string }
  | { type: 'story'; id: string; item: NewsCardItem; variant: 'article' | 'video' | 'local' }
  | { type: 'source'; id: string; name: string; handle: string; kind: string; language: string };

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

  return {
    stories: liveStories.length > 0 ? liveStories : fallback.filter((item) => item.source !== 'youtube'),
    videos: liveVideos.length > 0 ? liveVideos : fallback.filter((item) => item.source === 'youtube' || item.videoId),
  };
}

export default function SearchScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [tab, setTab] = useState<SearchTab>('All');
  const trimmedQuery = query.trim();

  const resultsQuery = useQuery({
    queryKey: ['explore-search', trimmedQuery],
    queryFn: () => loadSearchResults(trimmedQuery),
    enabled: trimmedQuery.length > 1,
    staleTime: 1000 * 60 * 5,
  });

  const rows = useMemo<ExploreRow[]>(() => {
    if (trimmedQuery.length > 1) {
      const stories = resultsQuery.data?.stories || [];
      const videos = resultsQuery.data?.videos || [];
      const sourceRows = TRUSTED_YOUTUBE_CHANNELS.filter((source) => {
        const haystack = `${source.name} ${source.handle} ${source.type} ${source.language}`.toLowerCase();
        return haystack.includes(trimmedQuery.toLowerCase());
      }).slice(0, 6);

      const output: ExploreRow[] = [];
      if (tab === 'All' || tab === 'Stories' || tab === 'Fact checks') {
        const filteredStories = tab === 'Fact checks'
          ? stories.filter((item) => item.category === 'fact_check' || item.channelType === 'fact_check')
          : stories;
        filteredStories.slice(0, tab === 'All' ? 4 : 12).forEach((item, index) => {
          output.push({
            type: 'story',
            id: `story_${item.id}_${index}`,
            item,
            variant: item.category === 'state' ? 'local' : 'article',
          });
        });
      }

      if (tab === 'All' || tab === 'Videos') {
        videos.slice(0, tab === 'All' ? 4 : 12).forEach((item, index) => {
          output.push({ type: 'story', id: `video_${item.id}_${index}`, item, variant: 'video' });
        });
      }

      if (tab === 'All' || tab === 'Sources') {
        sourceRows.forEach((source) => {
          output.push({
            type: 'source',
            id: source.id,
            name: source.name,
            handle: source.handle,
            kind: source.type.replace('_', ' '),
            language: source.language,
          });
        });
      }

      return output;
    }

    const selectedTopics = topic === 'all' ? INTERESTS.slice(0, 10) : INTERESTS.filter((item) => item.id === topic);
    return [
      { type: 'section', id: 'topics', title: 'Topics to follow', eyebrow: 'Personalize' },
      ...selectedTopics.map((item) => ({
        type: 'topic' as const,
        id: `topic_${item.id}`,
        topicId: item.id,
        title: item.label,
        source: item.keywords[0],
      })),
      { type: 'section', id: 'sources', title: 'Trusted video sources', eyebrow: 'Verified channels' },
      ...TRUSTED_YOUTUBE_CHANNELS.slice(0, 8).map((source) => ({
        type: 'source' as const,
        id: source.id,
        name: source.name,
        handle: source.handle,
        kind: source.type.replace('_', ' '),
        language: source.language,
      })),
    ];
  }, [resultsQuery.data, tab, topic, trimmedQuery]);

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
              Search stories, topics, trusted sources, local signals, and fact checks.
            </AppText>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Search news, source, topic..."
              returnKeyType="search"
              autoCapitalize="none"
            />

            {trimmedQuery.length > 1 ? (
              <>
                <View style={styles.chipWrap}>
                  {TABS.map((item) => (
                    <Chip key={item} label={item} selected={tab === item} onPress={() => setTab(item)} compact />
                  ))}
                </View>
                <SectionHeader
                  title={`Results for "${trimmedQuery}"`}
                  eyebrow={resultsQuery.isFetching ? 'Refreshing' : 'Live APIs with fallback'}
                />
              </>
            ) : (
              <>
                <SectionHeader title="Trending searches" />
                <View style={styles.chipWrap}>
                  {QUICK_SEARCHES.map((term) => (
                    <Chip key={term} label={term} onPress={() => setQuery(term)} />
                  ))}
                </View>
                <SectionHeader title="Browse by topic" />
                <View style={styles.chipWrap}>
                  <Chip label="All" selected={topic === 'all'} onPress={() => setTopic('all')} />
                  {INTERESTS.slice(0, 8).map((item) => (
                    <Chip
                      key={item.id}
                      label={item.label}
                      icon={item.emoji}
                      selected={topic === item.id}
                      onPress={() => setTopic(item.id)}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          if (item.type === 'section') {
            return (
              <View style={styles.sectionRow}>
                <SectionHeader title={item.title} eyebrow={item.eyebrow} />
              </View>
            );
          }

          if (item.type === 'story') {
            return <AnimatedNewsCard item={item.item} index={index} variant={item.variant} featured={tab === 'All' && index < 2} />;
          }

          if (item.type === 'source') {
            return (
              <Pressable
                accessibilityRole="link"
                onPress={() => Linking.openURL(`https://www.youtube.com/${item.handle}`)}
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
                <Badge label="Verified" tone="verified" />
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
              <Badge label="Topic" tone="muted" />
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
  sectionRow: { paddingHorizontal: spacing.lg },
  rowCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
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
