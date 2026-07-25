import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  useColorScheme, TextInput, Linking, Alert, StatusBar, Pressable,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { MOCK_DOCUMENTS } from '@/services/mockData';

type Document = (typeof MOCK_DOCUMENTS)[0];

const DOC_CATEGORIES = [
  { id: 'all', label: 'All', emoji: '📂' },
  { id: 'law', label: 'Law', emoji: '⚖️' },
  { id: 'rights', label: 'Rights', emoji: '✊' },
  { id: 'election', label: 'Election', emoji: '🗳️' },
  { id: 'agriculture', label: 'Agri', emoji: '🌾' },
];

function DocCard({ doc }: { doc: Document }) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const typeColors: Record<string, string> = {
    Act: C.trustDoc,
    'Government Order': C.trustCitizen,
    Guidelines: C.trustVerified,
    RTI: C.trustAI,
  };
  const typeColor = typeColors[doc.type] || C.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.docCard,
        { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      {/* Top row */}
      <View style={styles.docTop}>
        <View style={[styles.docTypeTag, { backgroundColor: typeColor + '20', borderColor: typeColor + '50' }]}>
          <Text style={[styles.docTypeText, { color: typeColor }]}>{doc.type}</Text>
        </View>
        <View style={[styles.langTag, { backgroundColor: C.border }]}>
          <Text style={[styles.langText, { color: C.textMuted }]}>
            {doc.language === 'both' ? '🇮🇳 HI+EN' : doc.language === 'hi' ? '🇮🇳 हिंदी' : '🇬🇧 EN'}
          </Text>
        </View>
      </View>

      <Text style={[styles.docTitle, { color: C.text }]}>{doc.title}</Text>

      <View style={styles.docMetaRow}>
        <Text style={[styles.docMinistry, { color: C.primary }]} numberOfLines={1}>
          🏛️ {doc.ministry}
        </Text>
        <Text style={[styles.docDate, { color: C.textMuted }]}>{doc.date}</Text>
      </View>

      {/* AI Summary */}
      <View style={[styles.docSummary, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
        <Text style={[styles.docSummaryLabel, { color: C.primary }]}>🤖 सारांश</Text>
        <Text style={[styles.docSummaryText, { color: C.textSecondary }]}>{doc.summary}</Text>
      </View>

      {/* Actions */}
      <View style={styles.docActions}>
        <TouchableOpacity
          style={[styles.docBtn, styles.docBtnPrimary, { backgroundColor: C.secondary }]}
          onPress={() => Linking.openURL(doc.url)}
        >
          <Text style={styles.docBtnPrimaryText}>📄 देखें / View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.docBtn, { borderColor: C.border, borderWidth: 1 }]}
          onPress={() => Alert.alert('AI Explain', `AI will explain this document in simple ${doc.language === 'hi' ? 'Hindi' : 'English'}. Requires Gemini API key.`)}
        >
          <Text style={[styles.docBtnSecText, { color: C.textSecondary }]}>🤖 AI समझाओ</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

export default function DocumentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = MOCK_DOCUMENTS.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.ministry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.secondary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.secondary, borderBottomColor: C.primary }]}>
        <Text style={styles.headerTitle}>📂 दस्तावेज़ • Documents</Text>
        <Text style={styles.headerSub}>Government orders, RTI, Laws — AI simplified</Text>
      </View>

      {/* RTI Banner */}
      <TouchableOpacity
        style={[styles.rtiBanner, { backgroundColor: C.primary }]}
        onPress={() => Linking.openURL('https://rtionline.gov.in')}
      >
        <Text style={styles.rtiBannerText}>✊ RTI दायर करें — File a Right to Information Request →</Text>
      </TouchableOpacity>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: C.text }]}
          placeholder="खोजें — ministry, law name..."
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Chips */}
      <View style={styles.categoryRow}>
        {DOC_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.catChip,
                { backgroundColor: isSelected ? C.secondary : C.surface, borderColor: C.border },
              ]}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, { color: isSelected ? '#fff' : C.textSecondary }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DocCard doc={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>📂</Text>
            <Text style={[{ color: C.textSecondary, marginTop: 12 }]}>कोई दस्तावेज़ नहीं मिला</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 3,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3 },

  rtiBanner: {
    paddingHorizontal: 20, paddingVertical: 12,
    alignItems: 'center',
  },
  rtiBannerText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  searchContainer: {
    margin: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },

  categoryRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12,
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 16 },

  docCard: {
    borderRadius: 16, borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  docTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  docTypeTag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  docTypeText: { fontSize: 11, fontWeight: '700' },
  langTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  langText: { fontSize: 11, fontWeight: '600' },

  docTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21, marginBottom: 8 },
  docMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  docMinistry: { fontSize: 12, fontWeight: '600', flex: 1 },
  docDate: { fontSize: 11 },

  docSummary: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12 },
  docSummaryLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  docSummaryText: { fontSize: 12.5, lineHeight: 18 },

  docActions: { flexDirection: 'row', gap: 10 },
  docBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  docBtnPrimary: {},
  docBtnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  docBtnSecText: { fontSize: 13, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 60 },
});
