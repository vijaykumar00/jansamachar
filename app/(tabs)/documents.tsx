import React, { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import { getIndiaGeoData, type GeoDistrict, type GeoState } from '@/services/geoService';
import { fetchDistrictNews, fetchStateNews, toNewsItem } from '@/services/newsDataService';
import { MOCK_DOCUMENTS, MOCK_NEWS_ITEMS } from '@/services/mockData';
import { getCitizenNewsItems } from '@/services/supabaseService';
import { useProfileStore } from '@/store/userProfileStore';
import AnimatedNewsCard, { type NewsCardItem } from '@/components/AnimatedNewsCard';
import {
  AppButton,
  AppText,
  Badge,
  BottomSheet,
  Chip,
  EmptyState,
  LoadingState,
  Screen,
  SearchField,
  SectionHeader,
} from '@/components/ui/design-system';

type Document = (typeof MOCK_DOCUMENTS)[0];
type LocalRow = { type: 'story'; id: string; item: NewsCardItem } | { type: 'doc'; id: string; doc: Document };

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'law', label: 'Law' },
  { id: 'rights', label: 'Rights' },
  { id: 'election', label: 'Election' },
  { id: 'agriculture', label: 'Agriculture' },
];

async function loadLocalStories(profile: ReturnType<typeof useProfileStore.getState>['profile']) {
  const lang = profile.language === 'both' ? 'hi,en' : profile.language;
  const [district, state, citizen] = await Promise.allSettled([
    fetchDistrictNews(profile.districtName, profile.stateName, lang),
    fetchStateNews(profile.stateName, lang),
    getCitizenNewsItems(8, 'local'),
  ]);

  const localItems = [
    ...(district.status === 'fulfilled' ? district.value.map(toNewsItem) : []),
    ...(state.status === 'fulfilled' ? state.value.map(toNewsItem) : []),
    ...(citizen.status === 'fulfilled' ? citizen.value : []),
  ].map((item) => ({ ...item, category: item.category || 'state' }));

  const fallback = MOCK_NEWS_ITEMS
    .filter((item) => ['state', 'accountability', 'fact_check'].includes(item.category || ''))
    .map((item) => ({ ...item, category: item.category || 'state' }));

  return localItems.length > 0 ? localItems.slice(0, 12) : fallback.slice(0, 6);
}

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
      <AppText variant="caption" tone="muted">{doc.ministry} - {doc.date}</AppText>
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
  const { profile, setProfile } = useProfileStore();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<GeoState | null>(null);

  const localQuery = useQuery({
    queryKey: ['local-tab', profile.districtName, profile.stateName, profile.language],
    queryFn: () => loadLocalStories(profile),
    staleTime: 1000 * 60 * 6,
  });

  const geoQuery = useQuery({
    queryKey: ['india-geo'],
    queryFn: getIndiaGeoData,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const documents = useMemo(() => {
    return MOCK_DOCUMENTS.filter((doc) => {
      const matchesCategory = category === 'all' || doc.category === category;
      const haystack = `${doc.title} ${doc.ministry} ${doc.summary}`.toLowerCase();
      return matchesCategory && haystack.includes(search.trim().toLowerCase());
    });
  }, [category, search]);

  const rows = useMemo<LocalRow[]>(() => {
    const storyRows = (localQuery.data || []).slice(0, 5).map((item, index) => ({
      type: 'story' as const,
      id: `local_${item.id}_${index}`,
      item,
    }));
    const docRows = documents.map((doc) => ({ type: 'doc' as const, id: doc.id, doc }));
    return [...storyRows, ...docRows];
  }, [documents, localQuery.data]);

  const states = geoQuery.data || [];
  const districtChoices = selectedState?.districts || states.find((state) => state.name === profile.stateName)?.districts || [];

  const applyDistrict = (state: GeoState, district: GeoDistrict) => {
    setProfile({
      stateId: state.id,
      stateName: state.name,
      districtId: district.id,
      districtName: district.name,
    });
    setLocationSheetOpen(false);
    setSelectedState(null);
  };

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <FlatList
        data={rows}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        refreshControl={
          <RefreshControl
            refreshing={localQuery.isRefetching}
            onRefresh={localQuery.refetch}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.localHero, { backgroundColor: C.secondary }]}>
              <AppText variant="caption" tone="inverse">Current district</AppText>
              <AppText variant="display" tone="inverse">{profile.districtName}</AppText>
              <AppText variant="body" tone="inverse" style={{ opacity: 0.76 }}>
                Local stories, citizen posts, civic documents, alerts, and government updates for {profile.stateName}.
              </AppText>
              <View style={styles.actionRow}>
                <AppButton label="Change location" variant="secondary" onPress={() => setLocationSheetOpen(true)} style={{ flex: 1 }} />
                <AppButton label="Use saved area" style={{ flex: 1 }} onPress={() => localQuery.refetch()} />
              </View>
            </View>

            <SectionHeader title="Nearby and state updates" eyebrow={localQuery.isFetching ? 'Refreshing' : 'NewsData + Supabase'} />
            {localQuery.isLoading ? <LoadingState label="Loading local updates..." /> : null}

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
                  compact
                />
              ))}
            </View>
            <AppButton
              label="File RTI request"
              icon="RTI"
              onPress={() => Linking.openURL('https://rtionline.gov.in')}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        }
        renderItem={({ item, index }) => {
          if (item.type === 'story') {
            return <AnimatedNewsCard item={item.item} index={index} variant="local" />;
          }
          return <DocumentCard doc={item.doc} />;
        }}
        ListEmptyComponent={<EmptyState title="No local items" message="Try a different category, shorter search term, or pull to refresh." />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <BottomSheet visible={locationSheetOpen} title="Change Location" onClose={() => setLocationSheetOpen(false)}>
        <AppText variant="caption" tone="muted" style={{ marginBottom: spacing.sm }}>Choose a state, then a district.</AppText>
        <View style={styles.locationGrid}>
          <View style={styles.locationColumn}>
            <AppText variant="label">State</AppText>
            <FlatList
              data={states.slice(0, 18)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Chip
                  label={item.name}
                  selected={(selectedState?.id || profile.stateId) === item.id}
                  onPress={() => setSelectedState(item)}
                  compact
                  style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }}
                />
              )}
              style={styles.locationList}
            />
          </View>
          <View style={styles.locationColumn}>
            <AppText variant="label">District</AppText>
            <FlatList
              data={districtChoices.slice(0, 24)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const state = selectedState || states.find((entry) => entry.name === profile.stateName);
                if (!state) return null;
                return (
                  <Chip
                    label={item.name}
                    selected={profile.districtId === item.id}
                    onPress={() => applyDistrict(state, item)}
                    compact
                    style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }}
                  />
                );
              }}
              style={styles.locationList}
            />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 104 },
  header: { padding: spacing.lg },
  localHero: { borderRadius: 22, padding: spacing.xl, gap: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  locationGrid: { flexDirection: 'row', gap: spacing.md, minHeight: 320 },
  locationColumn: { flex: 1, gap: spacing.sm },
  locationList: { maxHeight: 320 },
});
