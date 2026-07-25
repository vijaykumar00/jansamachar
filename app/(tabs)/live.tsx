import React, { useState } from 'react';
import { Alert, FlatList, Linking, Pressable, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import { MOCK_LIVE_STREAMS, MOCK_NEWS_ITEMS } from '@/services/mockData';
import {
  AppButton,
  AppText,
  Badge,
  Chip,
  EmptyState,
  IconButton,
  Screen,
  SectionHeader,
} from '@/components/ui/design-system';

const FILTERS = ['All', 'Live', 'Explainers', 'Fact checks', 'Ground reports'];

function formatViewers(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function VideoScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const [filter, setFilter] = useState('All');
  const featured = MOCK_NEWS_ITEMS.find((item) => item.videoId) || MOCK_NEWS_ITEMS[0];
  const videoStories = MOCK_NEWS_ITEMS.filter((item) => item.videoId || item.source === 'youtube');

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <FlatList
        data={videoStories}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.player, { backgroundColor: C.secondary }]}>
              <Image
                source={{ uri: featured.thumbnailUrl }}
                style={styles.playerImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={180}
              />
              <View style={[styles.playerOverlay, { backgroundColor: C.overlay }]}>
                <View style={styles.playerTop}>
                  <Badge label="Featured video" tone="live" icon="▶" />
                  <IconButton label="Share featured video" icon="↗" />
                </View>
                <View style={styles.playerBottom}>
                  <AppText variant="screenTitle" tone="inverse" numberOfLines={2}>{featured.title}</AppText>
                  <AppText variant="caption" tone="inverse" style={{ opacity: 0.78 }}>
                    {featured.channelName} • sound starts only after play
                  </AppText>
                  <AppButton
                    label="Watch now"
                    icon="▶"
                    onPress={() => Linking.openURL(featured.url || 'https://youtube.com')}
                    style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((item) => (
                <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
              ))}
            </View>

            <SectionHeader title="Live channels" eyebrow="Available when sources are online" />
            <View style={styles.liveStack}>
              {MOCK_LIVE_STREAMS.map((stream) => (
                <Pressable
                  key={stream.id}
                  accessibilityRole="button"
                  onPress={() => Alert.alert('Video unavailable', 'Live playback will activate when the streaming API is configured.')}
                  style={({ pressed }) => [
                    styles.liveCard,
                    { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.88 : 1 },
                  ]}
                >
                  <Image source={{ uri: stream.thumbnail }} style={styles.liveThumb} contentFit="cover" cachePolicy="memory-disk" />
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

            <SectionHeader title="Latest videos" eyebrow="Trusted channels" />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(item.url || 'https://youtube.com')}
            style={({ pressed }) => [
              styles.videoRow,
              { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumb} contentFit="cover" cachePolicy="memory-disk" />
            <View style={styles.videoText}>
              <View style={styles.cardTop}>
                <Badge label="Video" tone="live" />
                {item.hasDoc ? <Badge label="Doc" tone="fact" /> : null}
              </View>
              <AppText variant="cardTitle" numberOfLines={2}>{item.title}</AppText>
              <AppText variant="caption" tone="muted">{item.channelName}</AppText>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="No videos available" message="Try again when video sources refresh." />}
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
  liveText: { flex: 1, padding: spacing.md, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  videoRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  videoThumb: { width: 120, minHeight: 116 },
  videoText: { flex: 1, padding: spacing.md, gap: spacing.sm },
});
