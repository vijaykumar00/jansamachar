import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { getIndiaGeoData, type GeoDistrict, type GeoState } from '@/services/geoService';
import { fetchDistrictNews, fetchStateNews, toNewsItem } from '@/services/newsDataService';
import { MOCK_DOCUMENTS, MOCK_NEWS_ITEMS } from '@/services/mockData';
import { getCitizenNewsItems } from '@/services/supabaseService';
import { openExternalUrl } from '@/services/linkService';
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

function hasLocation(profile: ReturnType<typeof useProfileStore.getState>['profile']) {
  return Boolean(profile.stateId && profile.stateName && profile.districtId && profile.districtName);
}

async function loadLocalStories(profile: ReturnType<typeof useProfileStore.getState>['profile']) {
  const lang = profile.language === 'both' ? 'hi,en' : profile.language;
  const [district, state, citizen] = await Promise.allSettled([
    fetchDistrictNews(profile.districtName, profile.stateName, lang),
    fetchStateNews(profile.stateName, lang),
    getCitizenNewsItems(8, 'local'),
  ]);

  const publisherItems = [
    ...(district.status === 'fulfilled' ? district.value.map(toNewsItem) : []),
    ...(state.status === 'fulfilled' ? state.value.map(toNewsItem) : []),
  ].map((item) => ({
    ...item,
    category: item.category || 'state',
    sourceType: 'verified_publisher' as const,
  }));

  const citizenItems = (citizen.status === 'fulfilled' ? citizen.value : []).map((item) => ({
    ...item,
    category: item.category || 'state',
    sourceType: 'citizen_report' as const,
  }));

  const fallback = MOCK_NEWS_ITEMS
    .filter((item) => ['state', 'accountability', 'fact_check'].includes(item.category || ''))
    .map((item, index) => ({
      ...item,
      category: item.category || 'state',
      sourceType: index % 4 === 0 ? 'citizen_report' as const : 'verified_publisher' as const,
    }));

  const combined = [...publisherItems, ...citizenItems];
  return {
    items: combined.length > 0 ? combined.slice(0, 14) : fallback.slice(0, 8),
    fallbackLabel: combined.length === 0 ? `Showing saved stories from ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : '',
  };
}

function DocumentCard({ doc }: { doc: Document }) {
  const C = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openExternalUrl(doc.url)}
      style={({ pressed }) => [
        styles.docCard,
        { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View style={styles.cardTop}>
        <Badge label={doc.type} tone={doc.type === 'Act' ? 'fact' : 'verified'} />
        <Badge label={doc.language === 'both' ? 'HI + EN' : doc.language.toUpperCase()} tone="topic" />
      </View>
      <AppText variant="cardTitle">{doc.title}</AppText>
      <AppText variant="caption" tone="muted">{doc.ministry} - {doc.date}</AppText>
      <AppText variant="body" tone="secondary" numberOfLines={2}>{doc.summary}</AppText>
    </Pressable>
  );
}

export default function LocalScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { profile, setProfile } = useProfileStore();
  const locationReady = hasLocation(profile);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<GeoState | null>(null);

  const localQuery = useQuery({
    queryKey: ['local-tab', profile.districtName, profile.stateName, profile.language],
    queryFn: () => loadLocalStories(profile),
    enabled: locationReady,
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
    if (!locationReady) return [];
    const storyRows = (localQuery.data?.items || []).map((item, index) => ({
      type: 'story' as const,
      id: `local_${item.id}_${index}`,
      item,
    }));
    const docRows = documents.slice(0, 3).map((doc) => ({ type: 'doc' as const, id: doc.id, doc }));
    return [...storyRows, ...docRows];
  }, [documents, localQuery.data?.items, locationReady]);

  const states = geoQuery.data || [];
  const activeState = selectedState || states.find((state) => state.id === profile.stateId || state.name === profile.stateName) || null;
  const districtChoices = activeState?.districts || [];

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
            colors={[C.coral]}
            tintColor={C.coral}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {!locationReady ? (
              <View style={[styles.emptyLocation, { backgroundColor: C.card, borderColor: C.border }]}>
                <AppText variant="screenTitle">Set your local area</AppText>
                <AppText variant="body" tone="secondary">
                  Choose a district to unlock verified local updates and citizen reports.
                </AppText>
                <AppButton label="Set location" onPress={() => setLocationSheetOpen(true)} style={{ alignSelf: 'flex-start' }} />
              </View>
            ) : (
              <>
                <View style={[styles.localHero, { backgroundColor: C.secondary }]}>
                  <AppText variant="caption" tone="inverse">Pin: district-level locality</AppText>
                  <AppText variant="display" tone="inverse">{profile.districtName}</AppText>
                  <AppText variant="body" tone="inverse" style={{ opacity: 0.76 }}>
                    Verified publisher updates and citizen reports for {profile.stateName}.
                  </AppText>
                  <View style={styles.actionRow}>
                    <AppButton label="Change location" variant="secondary" onPress={() => setLocationSheetOpen(true)} style={{ flex: 1 }} />
                    <AppButton label="Refresh local" style={{ flex: 1 }} onPress={() => localQuery.refetch()} />
                  </View>
                </View>
                <View style={styles.sourceLegend}>
                  <Badge label="verified_publisher" tone="verified" />
                  <Badge label="citizen_report" tone="topic" />
                </View>
                <SectionHeader title="Nearby updates" eyebrow={localQuery.isFetching ? 'Refreshing' : 'NewsData + geo + Supabase'} />
                {localQuery.data?.fallbackLabel ? (
                  <View style={[styles.savedNotice, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
                    <AppText variant="caption" tone="secondary">{localQuery.data.fallbackLabel}</AppText>
                  </View>
                ) : null}
                {localQuery.isLoading ? <LoadingState label="Loading local updates..." /> : null}
              </>
            )}

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
          </View>
        }
        renderItem={({ item, index }) => {
          if (item.type === 'story') {
            return <AnimatedNewsCard item={item.item} index={index} variant="local" />;
          }
          return <DocumentCard doc={item.doc} />;
        }}
        ListEmptyComponent={
          locationReady ? <EmptyState title="No local items" message="Pull to refresh or try again later." /> : null
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <BottomSheet visible={locationSheetOpen} title="Set Location" onClose={() => setLocationSheetOpen(false)}>
        <AppText variant="caption" tone="muted" style={{ marginBottom: spacing.sm }}>Choose a state, then a district.</AppText>
        <View style={styles.locationGrid}>
          <View style={styles.locationColumn}>
            <AppText variant="label">State</AppText>
            <FlatList
              data={states.slice(0, 24)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Chip
                  label={item.name}
                  selected={(activeState?.id || profile.stateId) === item.id}
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
              data={districtChoices.slice(0, 30)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                if (!activeState) return null;
                return (
                  <Chip
                    label={item.name}
                    selected={profile.districtId === item.id}
                    onPress={() => applyDistrict(activeState, item)}
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
  emptyLocation: { borderRadius: radius.card, borderWidth: 1, padding: spacing.xl, gap: spacing.md },
  localHero: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.sm },
  sourceLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  savedNotice: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  docCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  locationGrid: { flexDirection: 'row', gap: spacing.md, minHeight: 320 },
  locationColumn: { flex: 1, gap: spacing.sm },
  locationList: { maxHeight: 320 },
});
