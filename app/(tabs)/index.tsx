import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  useColorScheme, RefreshControl, ScrollView, Pressable,
  StatusBar, Image, Linking, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { fetchAllNews, fetchBreakingNews, NewsItem } from '@/services/newsService';
import { NEWS_CATEGORIES } from '@/constants/sources';
import { summarizeNews } from '@/services/geminiService';
import * as Sharing from 'expo-sharing';

// ── Trust Badge ────────────────────────────────────────────────────────────
function TrustBadge({ level, hasDoc }: { level: string; hasDoc?: boolean }) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const badges: Record<string, { emoji: string; label: string; color: string }> = {
    verified: { emoji: '🟢', label: 'Verified', color: C.trustVerified },
    youtube: { emoji: '▶️', label: 'YouTube', color: C.trustYoutube },
    citizen: { emoji: '🟡', label: 'Citizen', color: C.trustCitizen },
    breaking: { emoji: '🔴', label: 'Breaking', color: C.trustBreaking },
    official: { emoji: '🏛️', label: 'Official', color: C.trustDoc },
  };
  const badge = badges[level] || badges.citizen;

  return (
    <View style={styles.badgeRow}>
      <View style={[styles.badge, { backgroundColor: badge.color + '22', borderColor: badge.color + '55' }]}>
        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
      </View>
      {hasDoc && (
        <View style={[styles.badge, { backgroundColor: C.trustDoc + '22', borderColor: C.trustDoc + '55', marginLeft: 4 }]}>
          <Text style={styles.badgeEmoji}>📄</Text>
          <Text style={[styles.badgeText, { color: C.trustDoc }]}>Doc</Text>
        </View>
      )}
    </View>
  );
}

// ── Time Ago ───────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Breaking News Ticker ───────────────────────────────────────────────────
function BreakingTicker({ items }: { items: NewsItem[] }) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;

  if (!items.length) return null;

  return (
    <View style={[styles.tickerContainer, { backgroundColor: C.live }]}>
      <View style={styles.tickerBadge}>
        <Text style={styles.tickerBadgeText}>🔴 BREAKING</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tickerScroll}>
        {items.map((item, i) => (
          <Text key={item.id} style={styles.tickerText}>
            {item.title}
            {i < items.length - 1 ? '  •  ' : ''}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Category Chips ─────────────────────────────────────────────────────────
function CategoryChips({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsContainer}
    >
      {NEWS_CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? C.primary : C.surface,
                borderColor: isSelected ? C.primary : C.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: isSelected ? '#fff' : C.textSecondary }]}>
              {cat.labelEn}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── News Card ──────────────────────────────────────────────────────────────
function NewsCard({ item }: { item: NewsItem }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const [aiSummary, setAiSummary] = useState(item.aiSummary || '');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handlePress = () => {
    if (item.source === 'youtube' && item.videoId) {
      Linking.openURL(`https://www.youtube.com/watch?v=${item.videoId}`);
    } else if (item.url) {
      Linking.openURL(item.url);
    }
  };

  const handleAISummary = async () => {
    setShowModal(true);
    if (aiSummary) return; // already have summary
    setLoadingAI(true);
    try {
      const summary = await summarizeNews(item.title, item.description || '', 'both');
      setAiSummary(summary);
    } catch (err: any) {
      setAiSummary(`AI Error: ${err.message}\n\nGet a valid key at aistudio.google.com`);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareText = `📰 ${item.title}\n\n🔗 ${item.url || 'JanSamachar'}\n\nShare via JanSamachar — असली खबर`;
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        // Native share (works for text content)
        Alert.alert('Share', shareText, [
          { text: 'WhatsApp', onPress: () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(shareText)}`) },
          { text: 'Copy Link', onPress: () => Linking.openURL(item.url || '') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  return (
    <>
      {/* AI Summary Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: C.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>🤖 AI सारांश</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={[styles.modalClose, { color: C.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalNewsTitle, { color: C.textSecondary }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={[styles.modalDivider, { backgroundColor: C.border }]} />
            {loadingAI ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={C.primary} size="large" />
                <Text style={[{ color: C.textSecondary, marginTop: 12 }]}>Gemini AI सोच रहा है...</Text>
              </View>
            ) : (
              <Text style={[styles.modalSummary, { color: C.text }]}>{aiSummary}</Text>
            )}
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.primary }]}
              onPress={() => { setShowModal(false); handlePress(); }}
            >
              <Text style={styles.modalBtnText}>पूरी खबर पढ़ें →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: C.card,
            borderColor: C.border,
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        {/* Thumbnail */}
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: C.border }]}>
            <Text style={{ fontSize: 32 }}>📰</Text>
          </View>
        )}

        {/* YouTube badge overlay */}
        {item.source === 'youtube' && (
          <View style={styles.ytOverlay}>
            <Text style={styles.ytPlay}>▶</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          {/* Source + Time */}
          <View style={styles.cardMeta}>
            <Text style={[styles.cardSource, { color: C.primary }]} numberOfLines={1}>
              {item.channelName}
            </Text>
            <Text style={[styles.cardTime, { color: C.textMuted }]}>
              {timeAgo(item.publishedAt)}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={3}>
            {item.title}
          </Text>

          {/* Description */}
          {item.description ? (
            <Text style={[styles.cardDesc, { color: C.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {/* Trust + Actions */}
          <View style={styles.cardFooter}>
            <TrustBadge level={item.trustLevel} hasDoc={item.hasDoc} />
            <View style={styles.cardActions}>
              {/* 🤖 AI Summary Button — calls real Gemini API */}
              <TouchableOpacity
                style={[styles.aiBtn, { backgroundColor: C.primary + '20', borderColor: C.primary + '50' }]}
                onPress={handleAISummary}
              >
                {loadingAI
                  ? <ActivityIndicator size="small" color={C.primary} />
                  : <Text style={[styles.aiBtnText, { color: C.primary }]}>🤖 AI</Text>
                }
              </TouchableOpacity>
              {/* Share Button */}
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <Text style={[styles.actionBtnText, { color: C.textMuted }]}>↗</Text>
              </TouchableOpacity>
              {/* Read More */}
              <TouchableOpacity style={styles.actionBtn} onPress={handlePress}>
                <Text style={[styles.actionBtnText, { color: C.accent }]}>पढ़ें →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────
function AppHeader() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={[styles.header, { backgroundColor: C.secondary, borderBottomColor: C.primary }]}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoFlag}>🇮🇳</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>जन समाचार</Text>
          <Text style={styles.headerSubtitle}>JanSamachar • असली खबर</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: news = [], isLoading, refetch } = useQuery({
    queryKey: ['news'],
    queryFn: fetchAllNews,
    staleTime: 1000 * 60 * 5,
  });

  const { data: breaking = [] } = useQuery({
    queryKey: ['breaking'],
    queryFn: fetchBreakingNews,
    staleTime: 1000 * 60 * 2,
  });

  const filteredNews =
    selectedCategory === 'all'
      ? news
      : news.filter((n) => n.category === selectedCategory || n.trustLevel === selectedCategory);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'light-content'}
        backgroundColor={Colors.light.secondary}
      />
      <AppHeader />
      <BreakingTicker items={breaking} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>🗞️</Text>
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>खबरें लोड हो रही हैं...</Text>
          <Text style={[styles.loadingSubText, { color: C.textMuted }]}>Loading real news from trusted sources</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NewsCard item={item} />}
          ListHeaderComponent={
            <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                कोई खबर नहीं मिली। ऊपर खींचकर रिफ्रेश करें।
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    borderBottomWidth: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoContainer: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoFlag: { fontSize: 22 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.light.live,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // Breaking Ticker
  tickerContainer: {
    flexDirection: 'row', alignItems: 'center', height: 38, overflow: 'hidden',
  },
  tickerBadge: {
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  tickerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  tickerScroll: { flex: 1 },
  tickerText: { color: '#fff', fontSize: 12, fontWeight: '500', paddingHorizontal: 8, lineHeight: 38 },

  // Category Chips
  chipsContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, flexDirection: 'row', alignItems: 'center',
  },
  chipText: { fontSize: 12.5, fontWeight: '600' },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  // Card
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardImage: { width: '100%', height: 190 },
  cardImagePlaceholder: {
    width: '100%', height: 120, alignItems: 'center', justifyContent: 'center',
  },
  ytOverlay: {
    position: 'absolute', top: 80, left: '50%', transform: [{ translateX: -20 }],
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  ytPlay: { color: '#fff', fontSize: 18, marginLeft: 3 },
  cardBody: { padding: 14 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardSource: { fontSize: 12, fontWeight: '700', flex: 1 },
  cardTime: { fontSize: 11, marginLeft: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 19, marginBottom: 8 },

  // AI Summary
  aiSummaryBox: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10 },
  aiLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  aiText: { fontSize: 12, lineHeight: 18 },

  // Card Footer
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  badgeEmoji: { fontSize: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  // AI Button (inline on card)
  aiBtn: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
    alignItems: 'center', justifyContent: 'center', minWidth: 44,
  },
  aiBtnText: { fontSize: 12, fontWeight: '800' },

  // AI Summary Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalClose: { fontSize: 22, fontWeight: '400', paddingHorizontal: 4 },
  modalNewsTitle: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  modalDivider: { height: 1, marginBottom: 16 },
  modalLoading: { alignItems: 'center', paddingVertical: 30 },
  modalSummary: { fontSize: 15, lineHeight: 24, marginBottom: 24 },
  modalBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  loadingEmoji: { fontSize: 48 },
  loadingText: { fontSize: 18, fontWeight: '600' },
  loadingSubText: { fontSize: 13 },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
