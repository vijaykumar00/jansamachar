import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  useColorScheme, FlatList, Linking, StatusBar, Pressable,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { MOCK_NEWS_ITEMS } from '@/services/mockData';
import { TRUSTED_YOUTUBE_CHANNELS } from '@/constants/sources';

const QUICK_SEARCHES = ['Electoral Bond', 'RTI', 'Farmers', 'Adani', 'Manipur', 'Supreme Court', 'IMD Weather'];

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const [query, setQuery] = useState('');

  const results = query.length > 1
    ? MOCK_NEWS_ITEMS.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.channelName.toLowerCase().includes(query.toLowerCase()) ||
          (n.description || '').toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.secondary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.secondary, borderBottomColor: C.primary }]}>
        <Text style={styles.headerTitle}>🔍 खोजें • Search</Text>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }]}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="खबर, नेता, मुद्दा खोजें..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View style={styles.content}>
              {/* Quick searches */}
              <Text style={[styles.sectionTitle, { color: C.text }]}>⚡ Quick Search</Text>
              <View style={styles.quickSearchGrid}>
                {QUICK_SEARCHES.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[styles.quickChip, { backgroundColor: C.surface, borderColor: C.border }]}
                    onPress={() => setQuery(term)}
                  >
                    <Text style={[styles.quickChipText, { color: C.textSecondary }]}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Trusted sources */}
              <Text style={[styles.sectionTitle, { color: C.text }]}>📡 विश्वसनीय स्रोत • Trusted Sources</Text>
              {TRUSTED_YOUTUBE_CHANNELS.map((ch) => (
                <Pressable
                  key={ch.id}
                  style={({ pressed }) => [
                    styles.channelCard,
                    { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.9 : 1 },
                  ]}
                  onPress={() => Linking.openURL(`https://www.youtube.com/${ch.handle}`)}
                >
                  <View style={[styles.channelIcon, { backgroundColor: '#FF0000' + '22' }]}>
                    <Text style={{ fontSize: 22 }}>▶</Text>
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={[styles.channelName, { color: C.text }]}>{ch.name}</Text>
                    <Text style={[styles.channelHandle, { color: C.textMuted }]}>{ch.handle}</Text>
                    <View style={[styles.channelTypeBadge, { backgroundColor: C.primary + '20' }]}>
                      <Text style={[styles.channelTypeText, { color: C.primary }]}>
                        {ch.type.replace('_', ' ')} • {ch.language === 'hi' ? 'हिंदी' : 'English'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: C.textMuted, fontSize: 18 }}>→</Text>
                </Pressable>
              ))}
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.resultCard,
                { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => item.url && Linking.openURL(item.url)}
            >
              <Text style={[styles.resultTitle, { color: C.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.resultMeta}>
                <Text style={[styles.resultSource, { color: C.primary }]}>{item.channelName}</Text>
                <View style={[styles.resultBadge, {
                  backgroundColor: item.trustLevel === 'verified' ? Colors.light.trustVerified + '25' : Colors.light.trustYoutube + '25'
                }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: item.trustLevel === 'verified' ? Colors.light.trustVerified : Colors.light.trustYoutube }}>
                    {item.trustLevel === 'youtube' ? '▶ YouTube' : '🟢 Verified'}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={[styles.noResultsText, { color: C.textSecondary }]}>
                "{query}" के लिए कोई खबर नहीं मिली
              </Text>
              <Text style={[{ color: C.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 }]}>
                Try: Farmers, RTI, Supreme Court, Adani
              </Text>
            </View>
          }
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 3, gap: 12,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },

  content: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 8 },

  quickSearchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  quickChipText: { fontSize: 13, fontWeight: '600' },

  channelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  channelIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  channelInfo: { flex: 1 },
  channelName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  channelHandle: { fontSize: 12, marginBottom: 6 },
  channelTypeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  channelTypeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  resultCard: {
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  resultTitle: { fontSize: 15, fontWeight: '600', lineHeight: 21, marginBottom: 8 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultSource: { fontSize: 12, fontWeight: '700' },
  resultBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },

  noResults: { alignItems: 'center', paddingTop: 60, gap: 10 },
  noResultsText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
