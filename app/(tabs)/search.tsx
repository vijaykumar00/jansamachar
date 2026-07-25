import React, { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';
import { INTERESTS } from '@/constants/professions';
import { TRUSTED_YOUTUBE_CHANNELS } from '@/constants/sources';
import { spacing } from '@/constants/theme';
import { MOCK_NEWS_ITEMS } from '@/services/mockData';
import { AppText, Badge, Chip, EmptyState, Screen, SearchField, SectionHeader } from '@/components/ui/design-system';

const QUICK_SEARCHES = ['Supreme Court', 'Monsoon', 'MSP', 'GST', 'UPSC', 'Delhi AQI', 'Fact check'];

type ExploreRow =
  | { type: 'section'; id: string; title: string; eyebrow?: string }
  | { type: 'story'; id: string; title: string; source: string; url?: string; trustLevel?: string }
  | { type: 'source'; id: string; name: string; handle: string; kind: string; language: string };

export default function SearchScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];
    return MOCK_NEWS_ITEMS.filter((item) => {
      const haystack = `${item.title} ${item.channelName} ${item.description} ${item.category}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  const rows = useMemo<ExploreRow[]>(() => {
    if (query.trim().length > 1) {
      return results.map((item) => ({
        type: 'story',
        id: item.id,
        title: item.title,
        source: item.channelName,
        url: item.url,
        trustLevel: item.trustLevel,
      }));
    }

    const selectedTopics = topic === 'all' ? INTERESTS.slice(0, 10) : INTERESTS.filter((item) => item.id === topic);
    return [
      { type: 'section', id: 'topics', title: 'Topics to follow', eyebrow: 'Personalize' },
      ...selectedTopics.map((item) => ({
        type: 'story' as const,
        id: `topic_${item.id}`,
        title: `${item.labelHi} • ${item.label}`,
        source: item.keywords[0],
        trustLevel: 'topic',
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
  }, [query, results, topic]);

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
              Search stories, topics, sources, locations, and fact checks.
            </AppText>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Search news, source, topic..."
              returnKeyType="search"
              autoCapitalize="none"
            />

            {query.length === 0 ? (
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
            ) : (
              <SectionHeader title={`Results for "${query}"`} eyebrow={`${results.length} matches`} />
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={styles.sectionRow}>
                <SectionHeader title={item.title} eyebrow={item.eyebrow} />
              </View>
            );
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
                  <AppText variant="badge" tone="danger">▶</AppText>
                </View>
                <View style={styles.rowText}>
                  <AppText variant="cardTitle">{item.name}</AppText>
                  <AppText variant="caption" tone="muted">{item.handle} • {item.kind} • {item.language.toUpperCase()}</AppText>
                </View>
                <Badge label="Verified" tone="verified" />
              </Pressable>
            );
          }

          return (
            <Pressable
              accessibilityRole={item.url ? 'link' : 'button'}
              onPress={() => item.url && Linking.openURL(item.url)}
              style={({ pressed }) => [
                styles.rowCard,
                { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.86 : 1 },
              ]}
            >
              <View style={styles.rowText}>
                <AppText variant="cardTitle" numberOfLines={2}>{item.title}</AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>{item.source}</AppText>
              </View>
              <Badge
                label={item.trustLevel === 'youtube' ? 'Video' : item.trustLevel === 'topic' ? 'Topic' : 'Verified'}
                tone={item.trustLevel === 'youtube' ? 'live' : item.trustLevel === 'topic' ? 'muted' : 'verified'}
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          query.length > 1 ? (
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
