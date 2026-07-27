// JanSamachar — YouTube Search Service
// Searches YouTube for news videos by keyword/location (not just fixed channels)
// API: https://www.googleapis.com/youtube/v3/search
// Uses: videoCategoryId=25 (News & Politics), regionCode=IN, order=date

import { API_CONFIG } from '../constants/api';
import { trackEvent } from './analyticsService';
import { fetchWithTimeout } from './fetchService';
import { fetchProxyJson, hasBackendProxy } from './proxyClient';
import type { NewsItem } from './newsService';

const BASE = 'https://www.googleapis.com/youtube/v3/search';
const CACHE_TTL_MS = 3 * 60 * 1000;
let youtubeQuotaExhausted = false;
let youtubeQuotaNoticeShown = false;
const responseCache = new Map<string, { fetchedAt: number; data: YTSearchVideo[] }>();

export interface YTSearchVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
}

/**
 * Search YouTube for news videos matching a query
 * @param query  e.g. "Varanasi MSP kisan news today"
 * @param maxResults  max 50, default 10
 */
export async function searchYouTubeNews(
  query: string,
  maxResults = 10
): Promise<YTSearchVideo[]> {
  const limitedMaxResults = Math.min(maxResults, 25);
  const cacheKey = `${query}:${limitedMaxResults}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt <= CACHE_TTL_MS) return cached.data;
  if (cached) responseCache.delete(cacheKey);

  if (hasBackendProxy()) {
    try {
      const data = await fetchProxyJson<{ items?: YTSearchVideo[] }>('/youtube/search', {
        query,
        maxResults: limitedMaxResults,
      });
      const items = data.items || [];
      responseCache.set(cacheKey, { fetchedAt: Date.now(), data: items });
      return items;
    } catch {
      void trackEvent('provider_fallback_used', { provider: 'youtube_proxy', reason: 'provider_error' });
      return [];
    }
  }

  if (!API_CONFIG.YOUTUBE_API_KEY) return [];
  if (youtubeQuotaExhausted) return [];

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '25',   // News & Politics
    order: 'date',            // Most recent first
    regionCode: 'IN',         // India
    relevanceLanguage: 'hi',  // Prefer Hindi results
    maxResults: String(limitedMaxResults),
    key: API_CONFIG.YOUTUBE_API_KEY,
  });

  try {
    const res = await fetchWithTimeout(`${BASE}?${params.toString()}`, { timeoutMs: 9000, retries: 1 });
    if (!res.ok) {
      const err = await res.text();
      const isQuotaError =
        res.status === 429 ||
        err.includes('RESOURCE_EXHAUSTED') ||
        err.includes('quotaExceeded') ||
        err.includes('rateLimitExceeded');

      if (isQuotaError) {
        youtubeQuotaExhausted = true;
        void trackEvent('provider_fallback_used', { provider: 'youtube', reason: 'quota_exhausted' });
        if (!youtubeQuotaNoticeShown) {
          youtubeQuotaNoticeShown = true;
          console.info('YouTube quota exhausted for this session; using saved/mock video fallback.');
        }
        return [];
      }

      void trackEvent('provider_fallback_used', { provider: 'youtube', reason: String(res.status) });
      console.warn('YouTube Search failed:', res.status);
      return [];
    }
    const data = await res.json();
    const items = (data.items || []).map((item: any): YTSearchVideo => ({
      videoId: item.id?.videoId || '',
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url || '',
      channelName: item.snippet?.channelTitle || '',
      channelId: item.snippet?.channelId || '',
      publishedAt: item.snippet?.publishedAt || '',
    })).filter((v: YTSearchVideo) => v.videoId);
    responseCache.set(cacheKey, { fetchedAt: Date.now(), data: items });
    return items;
  } catch (e) {
    void trackEvent('provider_fallback_used', { provider: 'youtube', reason: 'provider_error' });
    console.warn('YouTube Search fetch failed. Using saved/mock video fallback.');
    return [];
  }
}

/** Convert YT search result to unified NewsItem */
export function ytSearchToNewsItem(v: YTSearchVideo): NewsItem {
  return {
    id: `yt_${v.videoId}`,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    channelName: v.channelName,
    channelId: v.channelId,
    channelType: 'youtube_search',
    language: 'hi',
    publishedAt: v.publishedAt,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    videoId: v.videoId,
    source: 'youtube' as const,
    trustLevel: 'youtube',
    hasDoc: false,
    category: 'general',
  };
}
