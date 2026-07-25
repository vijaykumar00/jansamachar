import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  useColorScheme, Image, Linking, Alert, StatusBar, Pressable,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { MOCK_LIVE_STREAMS } from '@/services/mockData';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function LiveStreamCard({ stream }: { stream: (typeof MOCK_LIVE_STREAMS)[0] }) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.streamCard,
        { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.92 : 1 },
      ]}
      onPress={() => Alert.alert('Coming Soon', 'Live streaming feature will be available after API setup!')}
    >
      <View style={styles.streamThumbContainer}>
        <Image source={{ uri: stream.thumbnail }} style={styles.streamThumb} />
        {stream.isLive && (
          <View style={styles.liveOverlay}>
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <Text style={styles.viewerCount}>👁 {formatViewers(stream.viewers)}</Text>
          </View>
        )}
        {stream.hasDoc && (
          <View style={styles.docBadge}>
            <Text style={styles.docBadgeText}>📄 DOC</Text>
          </View>
        )}
      </View>
      <View style={styles.streamBody}>
        <Text style={[styles.streamTitle, { color: C.text }]} numberOfLines={2}>
          {stream.title}
        </Text>
        <View style={styles.streamMeta}>
          <Text style={[styles.streamStreamer, { color: C.primary }]}>{stream.streamer}</Text>
          <Text style={[styles.streamTime, { color: C.textMuted }]}>{timeAgo(stream.startedAt)}</Text>
        </View>
        <View style={styles.streamActions}>
          <TouchableOpacity
            style={[styles.watchBtn, { backgroundColor: C.live }]}
            onPress={() => Alert.alert('Live Stream', 'Join this live stream!')}
          >
            <Text style={styles.watchBtnText}>▶ देखें</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: C.border }]}
            onPress={() => Alert.alert('Share', 'Share this stream to Facebook / Instagram')}
          >
            <Text style={[styles.shareBtnText, { color: C.textSecondary }]}>↗ Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

export default function LiveScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const [isGoingLive, setIsGoingLive] = useState(false);

  const handleGoLive = () => {
    Alert.alert(
      '🔴 Go Live — जन समाचार',
      'Going live requires:\n\n1. Agora.io API key (free tier: 10,000 min/month)\n2. Supabase account\n\nYour stream will be:\n✅ Visible on JanSamachar\n✅ Shareable to Facebook Live\n✅ Shareable to Instagram Live\n✅ Saved with proof documents',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Setup APIs', onPress: () =>
            Linking.openURL('https://agora.io/en/products/voice-video-calling/'),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'light-content'} backgroundColor={Colors.light.secondary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.secondary, borderBottomColor: C.live }]}>
        <Text style={styles.headerTitle}>🔴 लाइव • Live</Text>
        <Text style={styles.headerSub}>Real-time citizen journalism</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Go Live Banner */}
        <TouchableOpacity
          style={[styles.goLiveBanner, { backgroundColor: C.live }]}
          onPress={handleGoLive}
          activeOpacity={0.85}
        >
          <View style={styles.goLiveLeft}>
            <View style={styles.goLiveIcon}>
              <Text style={{ fontSize: 28 }}>📡</Text>
            </View>
            <View>
              <Text style={styles.goLiveTitle}>Go Live — सच दिखाओ</Text>
              <Text style={styles.goLiveSub}>Attach proof doc • Share to FB/Instagram</Text>
            </View>
          </View>
          <Text style={styles.goLiveArrow}>→</Text>
        </TouchableOpacity>

        {/* How it works */}
        <View style={[styles.infoCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.infoTitle, { color: C.text }]}>📋 लाइव स्ट्रीम कैसे काम करता है?</Text>
          {[
            { icon: '📄', text: 'सबूत दस्तावेज़ अटैच करें (PDF/Photo)' },
            { icon: '🔴', text: 'Live बटन दबाएं — JanSamachar पर दिखेगा' },
            { icon: '📱', text: 'Facebook Live और Instagram Live पर भी शेयर करें' },
            { icon: '💾', text: 'स्ट्रीम रिकॉर्ड होगा — सबूत के साथ' },
          ].map((step, i) => (
            <View key={i} style={styles.infoStep}>
              <Text style={styles.infoIcon}>{step.icon}</Text>
              <Text style={[styles.infoText, { color: C.textSecondary }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Active Streams */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>🔴 अभी लाइव • Currently Live</Text>
        {MOCK_LIVE_STREAMS.map((stream) => (
          <LiveStreamCard key={stream.id} stream={stream} />
        ))}

        {/* Share to social */}
        <View style={[styles.socialCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.socialTitle, { color: C.text }]}>📲 सोशल पर शेयर करें</Text>
          <Text style={[styles.socialSub, { color: C.textSecondary }]}>
            हर खबर और लाइव स्ट्रीम को WhatsApp, Facebook, Instagram पर शेयर करें
          </Text>
          <View style={styles.socialBtns}>
            {[
              { icon: '💬', name: 'WhatsApp', color: '#25D366' },
              { icon: '📘', name: 'Facebook', color: '#1877F2' },
              { icon: '📸', name: 'Instagram', color: '#E1306C' },
              { icon: '🐦', name: 'Twitter/X', color: '#000000' },
            ].map((s) => (
              <TouchableOpacity
                key={s.name}
                style={[styles.socialBtn, { backgroundColor: s.color }]}
                onPress={() => Alert.alert(`Share to ${s.name}`, 'Share feature coming soon!')}
              >
                <Text style={styles.socialBtnIcon}>{s.icon}</Text>
                <Text style={styles.socialBtnText}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 3, alignItems: 'flex-start',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  content: { padding: 16, gap: 16 },

  // Go Live
  goLiveBanner: {
    borderRadius: 16, padding: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#E53935', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  goLiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  goLiveIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  goLiveTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  goLiveSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
  goLiveArrow: { color: '#fff', fontSize: 24, fontWeight: '300' },

  // Info Card
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  infoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  infoStep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoIcon: { fontSize: 20, width: 28 },
  infoText: { fontSize: 13.5, flex: 1, lineHeight: 19 },

  // Section
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 4 },

  // Stream Card
  streamCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  streamThumbContainer: { position: 'relative' },
  streamThumb: { width: '100%', height: 180 },
  liveOverlay: {
    position: 'absolute', top: 10, left: 10, right: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  livePulse: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff',
  },
  liveBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  viewerCount: {
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
    fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  docBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(21,101,192,0.9)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  docBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  streamBody: { padding: 14 },
  streamTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21, marginBottom: 8 },
  streamMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  streamStreamer: { fontSize: 13, fontWeight: '600' },
  streamTime: { fontSize: 12 },
  streamActions: { flexDirection: 'row', gap: 10 },
  watchBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
  },
  watchBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  shareBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  shareBtnText: { fontSize: 14, fontWeight: '600' },

  // Social
  socialCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  socialTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  socialSub: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  socialBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  socialBtnIcon: { fontSize: 16 },
  socialBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
