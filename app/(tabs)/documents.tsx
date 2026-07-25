import React, { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import { MOCK_DOCUMENTS, MOCK_NEWS_ITEMS } from '@/services/mockData';
import { useProfileStore } from '@/store/userProfileStore';
import {
  AppButton,
  AppText,
  Badge,
  Chip,
  EmptyState,
  Screen,
  SearchField,
  SectionHeader,
} from '@/components/ui/design-system';

type Document = (typeof MOCK_DOCUMENTS)[0];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'law', label: 'Law' },
  { id: 'rights', label: 'Rights' },
  { id: 'election', label: 'Election' },
  { id: 'agriculture', label: 'Agriculture' },
];

function DocumentCard({ doc }: { doc: Document }) {
  const C = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(doc.url)}
      style={({ pressed }) => [
        styles.docCard,
        { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View style={styles.cardTop}>
        <Badge label={doc.type} tone={doc.type === 'Act' ? 'fact' : 'verified'} />
        <Badge label={doc.language === 'both' ? 'HI + EN' : doc.language.toUpperCase()} tone="muted" />
      </View>
      <AppText variant="cardTitle">{doc.title}</AppText>
      <AppText variant="caption" tone="muted">{doc.ministry} • {doc.date}</AppText>
      <View style={[styles.summaryBox, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
        <Badge label="AI-ready summary" tone="ai" />
        <AppText variant="body" tone="secondary">{doc.summary}</AppText>
      </View>
      <View style={styles.actionRow}>
        <AppButton label="Open document" onPress={() => Linking.openURL(doc.url)} style={{ flex: 1 }} />
        <AppButton label="Explain" variant="secondary" style={{ flex: 1 }} />
      </View>
    </Pressable>
  );
}

export default function LocalScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { profile } = useProfileStore();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const localStories = MOCK_NEWS_ITEMS.filter((item) => ['state', 'accountability', 'fact_check'].includes(item.category || '')).slice(0, 3);
  const documents = useMemo(() => {
    return MOCK_DOCUMENTS.filter((doc) => {
      const matchesCategory = category === 'all' || doc.category === category;
      const haystack = `${doc.title} ${doc.ministry} ${doc.summary}`.toLowerCase();
      return matchesCategory && haystack.includes(search.trim().toLowerCase());
    });
  }, [category, search]);

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <FlatList
        data={documents}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.localHero, { backgroundColor: C.secondary }]}>
              <AppText variant="caption" tone="inverse">Current district</AppText>
              <AppText variant="display" tone="inverse">{profile.districtName}</AppText>
              <AppText variant="body" tone="inverse" style={{ opacity: 0.76 }}>
                Local stories, civic documents, alerts, and government updates for {profile.stateName}.
              </AppText>
              <View style={styles.actionRow}>
                <AppButton label="Change location" variant="secondary" style={{ flex: 1 }} />
                <AppButton label="Use GPS" style={{ flex: 1 }} />
              </View>
            </View>

            <SectionHeader title="Nearby and state updates" eyebrow="Local signal" />
            <View style={styles.storyStack}>
              {localStories.map((story, index) => (
                <View key={`${story.id}_${index}`} style={[styles.localStory, { backgroundColor: C.card, borderColor: C.border }]}>
                  <View style={styles.rowText}>
                    <AppText variant="cardTitle" numberOfLines={2}>{story.title}</AppText>
                    <AppText variant="caption" tone="muted">{story.channelName} • verified source</AppText>
                  </View>
                  <Badge label={story.category === 'fact_check' ? 'Fact check' : 'Local'} tone={story.category === 'fact_check' ? 'fact' : 'verified'} />
                </View>
              ))}
            </View>

            <SectionHeader title="Civic documents" eyebrow="RTI, law, schemes" />
            <SearchField
              value={search}
              onChangeText={setSearch}
              placeholder="Search documents, ministry, scheme..."
              containerStyle={{ marginBottom: spacing.md }}
            />
            <View style={styles.chipWrap}>
              {CATEGORIES.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={category === item.id}
                  onPress={() => setCategory(item.id)}
                />
              ))}
            </View>
            <AppButton
              label="File RTI request"
              icon="✊"
              onPress={() => Linking.openURL('https://rtionline.gov.in')}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        }
        renderItem={({ item }) => <DocumentCard doc={item} />}
        ListEmptyComponent={<EmptyState title="No civic documents" message="Try a different category or a shorter search term." />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 104 },
  header: { padding: spacing.lg },
  localHero: { borderRadius: 22, padding: spacing.xl, gap: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  storyStack: { gap: spacing.sm },
  localStory: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  docCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  summaryBox: { borderRadius: 12, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
});
