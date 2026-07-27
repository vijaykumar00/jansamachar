import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { AppButton, AppIcon, AppText, Badge, BottomSheet, IconButton, Screen } from '@/components/ui/design-system';
import { factCheck, summarizeNews } from '@/services/geminiService';
import { openExternalUrl } from '@/services/linkService';
import { MOCK_NEWS_ITEMS } from '@/services/mockData';
import { fetchNewsItemById, type NewsItem } from '@/services/newsService';
import { useProfileStore, useResolvedColorScheme } from '@/store/userProfileStore';

type SheetMode = 'save' | 'share' | 'fact' | null;

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'recently';
  return parsed.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function estimateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function routeFallbackArticle(params: ReturnType<typeof useLocalSearchParams>): NewsItem {
  const fallback = MOCK_NEWS_ITEMS[0];
  return {
    ...fallback,
    id: asString(params.id) || fallback.id,
    title: asString(params.title) || fallback.title,
    description: asString(params.description) || fallback.description,
    channelName: asString(params.source) || fallback.channelName,
    publishedAt: asString(params.publishedAt) || fallback.publishedAt,
    url: asString(params.url) || fallback.url || '',
    thumbnailUrl: asString(params.thumbnailUrl) || fallback.thumbnailUrl,
    trustLevel: (asString(params.trustLevel) || fallback.trustLevel) as NewsItem['trustLevel'],
    category: asString(params.category) || fallback.category || '',
    aiSummary: asString(params.aiSummary) || fallback.aiSummary || '',
  };
}

export default function ModalScreen() {
  const isDark = useResolvedColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const params = useLocalSearchParams();
  const articleId = asString(params.id);
  const { profile, setProfile } = useProfileStore();
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [factResult, setFactResult] = useState<{ verdict: string; explanation: string } | null>(null);
  const [checkingFact, setCheckingFact] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  const articleQuery = useQuery({
    queryKey: ['article-detail', articleId],
    queryFn: () => fetchNewsItemById(articleId),
    enabled: Boolean(articleId),
    staleTime: 1000 * 60 * 10,
  });

  const fallbackArticle = useMemo(() => routeFallbackArticle(params), [params]);
  const article = articleQuery.data || fallbackArticle;
  const fallbackLabel = articleQuery.isFetched && !articleQuery.data && articleId
    ? `Showing route fallback from ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
    : '';
  const bodyText = useMemo(() => {
    const cleanDescription = article.description?.replace(/<[^>]*>/g, '').trim();
    return cleanDescription || 'This story is available from the original publisher. Open the source for the full report and latest updates.';
  }, [article.description]);
  const readTime = estimateReadTime(`${article.title} ${bodyText}`);
  const isVerified = ['verified', 'official', 'breaking'].includes(article.trustLevel);
  const logoLetter = (article.channelName || 'J').trim().charAt(0).toUpperCase();
  const readerScale = Math.min(1.25, Math.max(0.9, profile.readerFontScale || 1));

  const expandSummary = async () => {
    setSummaryExpanded((value) => !value);
    if (summary || article.aiSummary || loadingSummary) return;

    setLoadingSummary(true);
    try {
      setSummary(await summarizeNews(article.title, bodyText, 'both'));
    } finally {
      setLoadingSummary(false);
    }
  };

  const runFactCheck = async () => {
    if (checkingFact || factResult) {
      setSheetMode('fact');
      return;
    }

    setCheckingFact(true);
    try {
      const result = await factCheck(article.title);
      setFactResult(result);
      setSheetMode('fact');
    } finally {
      setCheckingFact(false);
    }
  };

  const setReaderScale = (nextScale: number) => {
    setProfile({ readerFontScale: Math.min(1.25, Math.max(0.9, Number(nextScale.toFixed(2)))) });
  };

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <View style={[styles.topBar, { backgroundColor: C.background, borderBottomColor: C.divider }]}>
        <IconButton label="Close article" icon="close" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" tone="muted" numberOfLines={1}>{article.channelName}</AppText>
          <AppText variant="label" numberOfLines={1}>Article reader</AppText>
        </View>
        <IconButton label="Save story" icon="save" onPress={() => setSheetMode('save')} />
        <IconButton label="Share story" icon="share" onPress={() => setSheetMode('share')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {article.thumbnailUrl && !profile.dataSaver ? (
          <Image source={{ uri: article.thumbnailUrl }} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.heroImage, styles.imageFallback, { backgroundColor: C.surfaceElevated }]}>
            <AppIcon name={profile.dataSaver ? 'offline' : 'image'} color={C.textMuted} size={26} />
            <AppText variant="badge" tone="muted">{profile.dataSaver ? 'PREVIEW OFF' : 'NO IMAGE'}</AppText>
          </View>
        )}

        <View style={styles.articleBody}>
          <AppText variant="display" style={styles.headline}>{article.title}</AppText>

          <View style={styles.bylineRow}>
            <View style={[styles.publisherLogo, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
              <AppText variant="badge">{logoLetter}</AppText>
            </View>
            <View style={styles.bylineText}>
              <View style={styles.publisherLine}>
                <AppText variant="caption" numberOfLines={1}>{article.channelName}</AppText>
                {isVerified ? <Badge tone="verified" /> : null}
              </View>
              <AppText variant="caption" tone="muted">{formatDate(article.publishedAt)} - {readTime}</AppText>
            </View>
          </View>

          {fallbackLabel ? (
            <View style={[styles.savedNotice, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
              <AppText variant="caption" tone="secondary">{fallbackLabel}</AppText>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle AI summary"
            onPress={expandSummary}
            style={[styles.summaryCard, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}
          >
            <View style={styles.panelHeader}>
              <Badge label="AI summary" tone="ai" />
              {loadingSummary ? <ActivityIndicator size="small" color={C.coral} /> : null}
            </View>
            {summaryExpanded ? (
              <>
                <AppText variant="body" tone="secondary">
                  {article.aiSummary || summary || 'Preparing a short summary...'}
                </AppText>
                <AppText variant="caption" tone="muted">
                  AI output can be wrong. Read the full story and source before acting.
                </AppText>
              </>
            ) : (
              <AppText variant="caption" tone="secondary">AI summary - tap to expand</AppText>
            )}
          </Pressable>

          <View style={styles.toolRow}>
            {factResult ? (
              <Pressable accessibilityRole="button" onPress={() => setSheetMode('fact')} style={styles.factBadgeTouch}>
                <Badge label={`Fact check: ${factResult.verdict}`} tone="verified" />
              </Pressable>
            ) : (
              <AppButton
                label={checkingFact ? 'Checking...' : 'Check facts'}
                variant="secondary"
                size="sm"
                onPress={runFactCheck}
                disabled={checkingFact}
              />
            )}
            <View style={styles.fontStepper}>
              <AppButton label="A-" variant="ghost" size="sm" onPress={() => setReaderScale(readerScale - 0.05)} />
              <AppText variant="caption" tone="muted">{Math.round(readerScale * 100)}%</AppText>
              <AppButton label="A+" variant="ghost" size="sm" onPress={() => setReaderScale(readerScale + 0.05)} />
            </View>
          </View>

          <Text
            maxFontSizeMultiplier={2}
            style={[
              typography.body,
              styles.bodyText,
              {
                color: C.text,
                fontSize: typography.body.fontSize * readerScale,
                lineHeight: typography.body.lineHeight * readerScale,
              },
            ]}
          >
            {bodyText}
          </Text>

          {article.url ? (
            <AppButton label="Open original source" onPress={() => openExternalUrl(article.url || '')} />
          ) : null}
        </View>
      </ScrollView>

      <BottomSheet
        visible={sheetMode !== null}
        title={sheetMode === 'share' ? 'Share Story' : sheetMode === 'save' ? 'Save Story' : 'Fact Check Detail'}
        onClose={() => setSheetMode(null)}
        snapPoints={['38%', '70%']}
      >
        {sheetMode === 'share' ? (
          <View style={styles.sheetStack}>
            <AppText variant="body" tone="secondary">{article.title}</AppText>
            <AppButton label="Open link" onPress={() => openExternalUrl(article.url || '')} />
            <AppButton
              label="Share to WhatsApp"
              variant="secondary"
              onPress={() => openExternalUrl(`whatsapp://send?text=${encodeURIComponent(`${article.title}\n\n${article.url || 'JanSamachar'}`)}`)}
            />
          </View>
        ) : null}

        {sheetMode === 'save' ? (
          <View style={styles.sheetStack}>
            <Badge label="Saved" tone="saved" />
            <AppText variant="body" tone="secondary">This story is marked for this session. Account sync is still pending.</AppText>
            <AppButton label="Done" onPress={() => setSheetMode(null)} />
          </View>
        ) : null}

        {sheetMode === 'fact' ? (
          <View style={styles.sheetStack}>
            {checkingFact ? <ActivityIndicator color={C.coral} /> : null}
            {factResult ? (
              <>
                <Badge label={factResult.verdict} tone="verified" />
                <AppText variant="body" tone="secondary">{factResult.explanation}</AppText>
                <AppText variant="caption" tone="muted">
                  Source detail: Gemini checked the headline against its available context. Confirm critical claims with the original publisher and dedicated fact-check sources.
                </AppText>
              </>
            ) : (
              <AppText variant="body" tone="secondary">No checked result yet.</AppText>
            )}
          </View>
        ) : null}
      </BottomSheet>
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
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  articleBody: { padding: spacing.lg, gap: spacing.lg },
  headline: { letterSpacing: 0 },
  bylineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  publisherLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bylineText: { flex: 1, gap: spacing.xs },
  publisherLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  summaryCard: { borderWidth: 1, borderRadius: radius.card, padding: spacing.md, gap: spacing.sm },
  savedNotice: { borderWidth: 1, borderRadius: radius.control, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  toolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  factBadgeTouch: { minHeight: 48, justifyContent: 'center' },
  fontStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bodyText: { letterSpacing: 0 },
  sheetStack: { gap: spacing.md },
});
