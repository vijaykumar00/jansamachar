// JanSamachar — Personalized News Feed (v2)
// Sections: Breaking → District → State → National → Profession → Interest

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, ActivityIndicator,
  Animated, Dimensions, useColorScheme, Linking,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useProfileStore } from '@/store/userProfileStore';
import { buildPersonalizedFeed, getGreeting, type FeedSection } from '@/services/personalizationService';
import { PROFESSIONS } from '@/constants/professions';
import AnimatedNewsCard from '@/components/AnimatedNewsCard';
import { searchYouTubeNews, ytSearchToNewsItem } from '@/services/youtubeSearchService';

const { width } = Dimensions.get('window');

// ─── Breaking News Ticker ────────────────────────────────────────────────────
function BreakingTicker({ items }: { items: string[] }) {
  const translateX = useRef(new Animated.Value(width)).current;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: -width * 1.5, duration: 8000, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: width, duration: 0, useNativeDriver: true }),
      ])
    );
    anim.start();
    const interval = setInterval(() => setIdx(i => (i + 1) % items.length), 8500);
    return () => { anim.stop(); clearInterval(interval); };
  }, [items.length]);

  if (!items.length) return null;
  return (
    <View style={styles.ticker}>
      <View style={styles.tickerBadge}><Text style={styles.tickerBadgeText}>🔴 LIVE</Text></View>
      <View style={styles.tickerContent}>
        <Animated.Text style={[styles.tickerText, { transform: [{ translateX }] }]} numberOfLines={1}>
          {items[idx]}
        </Animated.Text>
      </View>
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ emoji, title, titleHi, onSeeAll }: {
  emoji: string; title: string; titleHi: string; onSeeAll?: () => void;
}) {
  const C = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <View>
          <Text style={[styles.sectionTitleHi, { color: C.text }]}>{titleHi}</Text>
          <Text style={[styles.sectionTitleEn, { color: C.textMuted }]}>{title}</Text>
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ color: C.primary, fontSize: 13, fontWeight: '700' }}>See all →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Geo Level Pills ─────────────────────────────────────────────────────────
const GEO_LEVELS = [
  { id: 'all', label: 'सब', labelEn: 'All', emoji: '⭐' },
  { id: 'district', label: 'जिला', labelEn: 'District', emoji: '📍' },
  { id: 'state', label: 'राज्य', labelEn: 'State', emoji: '🗺️' },
  { id: 'national', label: 'राष्ट्रीय', labelEn: 'National', emoji: '🇮🇳' },
  { id: 'international', label: 'विश्व', labelEn: 'World', emoji: '🌍' },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function PersonalizedFeed() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const { profile, isLoaded } = useProfileStore();
  const [sections, setSections] = useState<FeedSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [geoFilter, setGeoFilter] = useState('all');
  const [breakingNews, setBreakingNews] = useState<string[]>([]);

  const headerAnim = useRef(new Animated.Value(0)).current;

  const profession = PROFESSIONS.find(p => p.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (!isLoaded) return;
    if (!isRefresh) setLoading(true);
    try {
      const [feedSections, breaking] = await Promise.all([
        buildPersonalizedFeed(profile),
        searchYouTubeNews('India breaking news today', 5),
      ]);
      setSections(feedSections);
      setBreakingNews(breaking.map(v => v.title));
    } catch (e) {
      console.warn('Feed load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile, isLoaded]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useFocusEffect(useCallback(() => {
    Animated.spring(headerAnim, { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }).start();
  }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(true);
  }, [loadFeed]);

  const filteredSections = geoFilter === 'all'
    ? sections
    : sections.filter(s => s.geoLevel === geoFilter || s.geoLevel === 'profession' || s.geoLevel === 'interest');

  const allItems = filteredSections.flatMap(s => s.items);

  const greeting = getGreeting();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#060B18' : '#F0F2F8' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#040912" />

      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        },
      ]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.locationLine}>
              📍 {profile.districtName} • {profile.stateName}
            </Text>
          </View>
          <View style={styles.profBadge}>
            <Text style={{ fontSize: 22 }}>{profession.emoji}</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>जन समाचार</Text>
        <Text style={styles.headerSub}>असली खबर • Real News</Text>
      </Animated.View>

      {/* Breaking News Ticker */}
      <BreakingTicker items={breakingNews} />

      {/* Geo Filter Pills */}
      <View style={styles.geoFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.geoScroll}>
          {GEO_LEVELS.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.geoPill,
                geoFilter === g.id && styles.geoPillActive,
                { borderColor: geoFilter === g.id ? '#FF9933' : 'rgba(255,255,255,0.15)' },
              ]}
              onPress={() => setGeoFilter(g.id)}
            >
              <Text style={styles.geoPillEmoji}>{g.emoji}</Text>
              <Text style={[styles.geoPillText, geoFilter === g.id && { color: '#FF9933' }]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FF9933" size="large" />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>
            {profile.districtName} की खबरें लोड हो रही हैं...
          </Text>
          <Text style={[styles.loadingSubText, { color: C.textMuted }]}>
            Fetching from YouTube • NewsData.io
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF9933']}
              tintColor="#FF9933"
            />
          }
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
        >
          {geoFilter === 'all' ? (
            // Show sections with headers
            sections.map(section => (
              <View key={section.id}>
                <SectionHeader
                  emoji={section.emoji}
                  title={section.title}
                  titleHi={section.titleHi}
                />
                {section.items.map((item, i) => (
                  <AnimatedNewsCard key={item.id} item={item} index={i} />
                ))}
              </View>
            ))
          ) : (
            // Show flat filtered list
            allItems.map((item, i) => (
              <AnimatedNewsCard key={item.id + i} item={item} index={i} />
            ))
          )}

          {sections.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>📡</Text>
              <Text style={[styles.emptyTitle, { color: C.text }]}>No news found</Text>
              <Text style={[styles.emptyDesc, { color: C.textMuted }]}>
                Pull down to refresh or check your internet connection
              </Text>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: '#FF9933' }]}
                onPress={() => loadFeed()}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#040912',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  greeting: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  locationLine: { color: '#FF9933', fontSize: 12, fontWeight: '700', marginTop: 2 },
  profBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,153,51,0.15)', borderWidth: 1.5, borderColor: '#FF993350',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },

  // Ticker
  ticker: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0D',
    paddingVertical: 8, paddingHorizontal: 12, overflow: 'hidden',
  },
  tickerBadge: { backgroundColor: '#cc0000', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 10 },
  tickerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  tickerContent: { flex: 1, overflow: 'hidden', height: 20 },
  tickerText: { color: '#fff', fontSize: 13, fontWeight: '600', position: 'absolute' },

  // Geo filter
  geoFilterRow: { paddingVertical: 10, borderBottomWidth: 0 },
  geoScroll: { paddingHorizontal: 16, gap: 8 },
  geoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  geoPillActive: { backgroundColor: 'rgba(255,153,51,0.15)' },
  geoPillEmoji: { fontSize: 13 },
  geoPillText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionEmoji: { fontSize: 22 },
  sectionTitleHi: { fontSize: 17, fontWeight: '800' },
  sectionTitleEn: { fontSize: 11, marginTop: 1 },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  loadingSubText: { fontSize: 12, textAlign: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
});
