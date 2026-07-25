// JanSamachar — Animated Glassmorphism News Card
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Linking, Alert, Animated, useColorScheme, ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { summarizeNews } from '@/services/geminiService';

export interface NewsCardItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  channelName: string;
  publishedAt: string;
  url?: string;
  videoId?: string;
  source: string;
  trustLevel: string;
  hasDoc?: boolean;
  category?: string;
  aiSummary?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TRUST_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  verified: { emoji: '🟢', color: '#4CAF50', label: 'Verified' },
  youtube: { emoji: '▶️', color: '#FF0000', label: 'YouTube' },
  newsdata: { emoji: '📰', color: '#2196F3', label: 'NewsData' },
  citizen: { emoji: '🟡', color: '#FFC107', label: 'Citizen' },
  official: { emoji: '🏛️', color: '#9C27B0', label: 'Official' },
};

interface Props {
  item: NewsCardItem;
  index: number;
}

export default function AnimatedNewsCard({ item, index }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  const [aiSummary, setAiSummary] = useState(item.aiSummary || '');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 4,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 14,
        bounciness: 4,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    if (item.source === 'youtube' && item.videoId) {
      Linking.openURL(`https://www.youtube.com/watch?v=${item.videoId}`);
    } else if (item.url) {
      Linking.openURL(item.url);
    }
  };

  const handleAI = async () => {
    setShowSummary(v => !v);
    if (aiSummary || loadingAI) return;
    setLoadingAI(true);
    try {
      const summary = await summarizeNews(item.title, item.description || '', 'both');
      setAiSummary(summary);
    } catch (e: any) {
      setAiSummary('🤖 AI Error: ' + e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleShare = () => {
    const text = `📰 ${item.title}\n\n🔗 ${item.url || 'JanSamachar'}\n\nShare via JanSamachar — असली खबर`;
    Alert.alert('Share', 'Share this news via:', [
      { text: '💬 WhatsApp', onPress: () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`) },
      { text: '📋 Open Link', onPress: () => item.url && Linking.openURL(item.url) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const trust = TRUST_CONFIG[item.trustLevel] || TRUST_CONFIG.citizen;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      {/* Glassmorphism Card */}
      <View style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        },
      ]}>
        {/* Saffron accent top border */}
        <View style={styles.accentBorder} />

        {/* Thumbnail */}
        {item.thumbnailUrl ? (
          <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
            {item.source === 'youtube' && (
              <View style={styles.ytBadge}>
                <Text style={styles.ytBadgeText}>▶ YouTube</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}

        <View style={styles.body}>
          {/* Source + Time */}
          <View style={styles.metaRow}>
            <View style={[styles.trustBadge, { backgroundColor: trust.color + '22' }]}>
              <Text style={{ fontSize: 9 }}>{trust.emoji}</Text>
              <Text style={[styles.trustText, { color: trust.color }]}>{trust.label}</Text>
            </View>
            <Text style={[styles.channelName, { color: C.primary }]} numberOfLines={1}>
              {item.channelName}
            </Text>
            <Text style={[styles.timeText, { color: C.textMuted }]}>
              {timeAgo(item.publishedAt)}
            </Text>
          </View>

          {/* Title */}
          <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
            <Text style={[styles.title, { color: isDark ? '#F5F5F5' : '#111' }]} numberOfLines={3}>
              {item.title}
            </Text>
          </TouchableOpacity>

          {/* Description */}
          {item.description ? (
            <Text style={[styles.desc, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {/* AI Summary Box */}
          {showSummary && (
            <View style={[styles.aiBox, { backgroundColor: C.primary + '12', borderColor: C.primary + '35' }]}>
              {loadingAI ? (
                <View style={styles.aiLoading}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={[styles.aiLoadingText, { color: C.textMuted }]}>Gemini सोच रहा है...</Text>
                </View>
              ) : (
                <Text style={[styles.aiText, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)' }]}>
                  {aiSummary}
                </Text>
              )}
            </View>
          )}

          {/* Action Row */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.aiBtn, { borderColor: C.primary + '50', backgroundColor: C.primary + '15' }]}
              onPress={handleAI}
            >
              <Text style={[styles.aiBtnText, { color: C.primary }]}>🤖 AI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={handleShare}>
              <Text style={[styles.actionIconText, { color: C.textMuted }]}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.readBtn, { backgroundColor: C.primary }]} onPress={handlePress}>
              <Text style={styles.readBtnText}>पढ़ें →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: { marginBottom: 14, marginHorizontal: 16 },
  card: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  accentBorder: { height: 3, backgroundColor: '#FF9933', width: '30%' },
  thumbnail: { width: '100%', height: 185 },
  ytBadge: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(255,0,0,0.85)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  ytBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  body: { padding: 14, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  trustText: { fontSize: 10, fontWeight: '700' },
  channelName: { fontSize: 12, fontWeight: '700', flex: 1 },
  timeText: { fontSize: 11 },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 23 },
  desc: { fontSize: 13, lineHeight: 19 },
  aiBox: { borderRadius: 12, borderWidth: 1, padding: 12 },
  aiLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLoadingText: { fontSize: 13 },
  aiText: { fontSize: 13, lineHeight: 21 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  aiBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  aiBtnText: { fontSize: 12, fontWeight: '800' },
  actionIcon: { padding: 6 },
  actionIconText: { fontSize: 16, fontWeight: '700' },
  readBtn: { marginLeft: 'auto', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  readBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
