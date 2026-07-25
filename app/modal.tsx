import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import { MOCK_NEWS_ITEMS } from '@/services/mockData';
import { factCheck, summarizeNews } from '@/services/geminiService';
import { AppButton, AppText, Badge, IconButton, Screen } from '@/components/ui/design-system';

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Recently updated';
  return parsed.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function ModalScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const params = useLocalSearchParams();
  const fallback = MOCK_NEWS_ITEMS[0];
  const article = useMemo(() => ({
    id: asString(params.id) || fallback.id,
    title: asString(params.title) || fallback.title,
    description: asString(params.description) || fallback.description,
    source: asString(params.source) || fallback.channelName,
    publishedAt: asString(params.publishedAt) || fallback.publishedAt,
    url: asString(params.url) || fallback.url || '',
    thumbnailUrl: asString(params.thumbnailUrl) || fallback.thumbnailUrl,
    trustLevel: asString(params.trustLevel) || fallback.trustLevel,
    category: asString(params.category) || fallback.category || '',
    aiSummary: asString(params.aiSummary) || fallback.aiSummary || '',
  }), [params, fallback]);

  const [summary, setSummary] = useState(article.aiSummary);
  const [claimVerdict, setClaimVerdict] = useState('');
  const [claimExplanation, setClaimExplanation] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingFactCheck, setLoadingFactCheck] = useState(false);

  const generateSummary = async () => {
    if (summary || loadingSummary) return;
    setLoadingSummary(true);
    try {
      setSummary(await summarizeNews(article.title, article.description, 'both'));
    } finally {
      setLoadingSummary(false);
    }
  };

  const runFactCheck = async () => {
    if (loadingFactCheck) return;
    setLoadingFactCheck(true);
    try {
      const result = await factCheck(article.title);
      setClaimVerdict(result.verdict);
      setClaimExplanation(result.explanation);
    } finally {
      setLoadingFactCheck(false);
    }
  };

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <View style={[styles.topBar, { backgroundColor: C.background, borderBottomColor: C.divider }]}>
        <IconButton label="Close article" icon="X" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" tone="muted" numberOfLines={1}>{article.source}</AppText>
          <AppText variant="label" numberOfLines={1}>Article reader</AppText>
        </View>
        {article.url ? <IconButton label="Open original source" icon=">" onPress={() => Linking.openURL(article.url)} /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {article.thumbnailUrl ? (
          <Image source={{ uri: article.thumbnailUrl }} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" />
        ) : null}
        <View style={styles.articleBody}>
          <View style={styles.badgeRow}>
            <Badge label={article.trustLevel === 'breaking' ? 'Breaking' : 'Verified source'} tone={article.trustLevel === 'breaking' ? 'live' : 'verified'} />
            {article.category ? <Badge label={article.category.replace('_', ' ')} tone="muted" /> : null}
          </View>

          <AppText variant="screenTitle">{article.title}</AppText>
          <AppText variant="caption" tone="muted">{article.source} - {formatDate(article.publishedAt)}</AppText>
          <AppText variant="body" tone="secondary">{article.description || 'Open the original source for the full report.'}</AppText>

          <View style={[styles.panel, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
            <View style={styles.panelHeader}>
              <Badge label="AI summary" tone="ai" />
              {loadingSummary ? <ActivityIndicator size="small" color={C.primary} /> : null}
            </View>
            {summary ? (
              <AppText variant="body" tone="secondary">{summary}</AppText>
            ) : (
              <AppButton label="Generate summary" variant="secondary" icon="AI" onPress={generateSummary} />
            )}
            <AppText variant="caption" tone="muted">
              AI output can be wrong. Use the original source for important decisions.
            </AppText>
          </View>

          <View style={[styles.panel, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
            <View style={styles.panelHeader}>
              <Badge label="Claim check" tone="fact" />
              {loadingFactCheck ? <ActivityIndicator size="small" color={C.primary} /> : null}
            </View>
            {claimVerdict ? (
              <>
                <AppText variant="bodyStrong">{claimVerdict}</AppText>
                <AppText variant="body" tone="secondary">{claimExplanation}</AppText>
              </>
            ) : (
              <AppButton label="Check headline claim" variant="secondary" onPress={runFactCheck} />
            )}
          </View>

          <View style={styles.actionRow}>
            {article.url ? <AppButton label="Open original" onPress={() => Linking.openURL(article.url)} style={{ flex: 1 }} /> : null}
            <AppButton label="Close" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: 64,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  content: { paddingBottom: 48 },
  heroImage: { width: '100%', aspectRatio: 16 / 9 },
  articleBody: { padding: spacing.lg, gap: spacing.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  panel: { borderWidth: 1, borderRadius: 16, padding: spacing.md, gap: spacing.sm },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
