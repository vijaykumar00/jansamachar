import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';
import { YOUTUBE_API_BASE } from '../constants/sources';
import { fetchWithTimeout } from './fetchService';
import {
  buildLocalYouTubeDiscoveryQueries,
  getMatchingLocalYouTubeSources,
  type LocalYouTubeSource,
} from './localSourceRegistry';
import type { NewsItem } from './newsService';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface LocalChannel {
  id: string;
  name: string;
  thumbnailUrl?: string;
  description?: string;
  state: string;
  district?: string;
  locality?: string;
  language: 'hi' | 'en' | 'regional';
  sourceId?: string;
  priority?: number;
}

interface YouTubeSearchItem {
  id?: {
    channelId?: string;
    videoId?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
}

export async function getLocalChannels(
  districtName: string,
  stateName: string,
  localityName?: string
): Promise<LocalChannel[]> {
  const cacheKey = buildCacheKey('local_channels', stateName, districtName, localityName);

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { channels, cachedAt } = JSON.parse(cached) as { channels: LocalChannel[]; cachedAt: number };
      if (Date.now() - cachedAt < CACHE_TTL_MS) return channels;
    }
  } catch {}

  const registrySources = getMatchingLocalYouTubeSources({ stateName, districtName, localityName });
  const directChannels = registrySources
    .filter((source) => source.youtube.channelId)
    .map((source) => sourceToChannel(source, districtName, localityName));

  const discoveryQueries = [
    ...registrySources
      .map((source) => source.youtube.searchQuery)
      .filter((query): query is string => Boolean(query)),
    ...buildLocalYouTubeDiscoveryQueries({ stateName, districtName, localityName }),
  ];

  const discovered = API_CONFIG.YOUTUBE_API_KEY
    ? await discoverChannels(discoveryQueries.slice(0, 4), stateName, districtName, localityName)
    : [];

  const channels = dedupeChannels([...directChannels, ...discovered]).slice(0, 8);

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ channels, cachedAt: Date.now() }));
  } catch {}

  return channels;
}

export async function fetchLocalChannelNews(
  districtName: string,
  stateName: string,
  maxPerChannel = 5,
  localityName?: string
): Promise<NewsItem[]> {
  const channels = await getLocalChannels(districtName, stateName, localityName);
  if (channels.length === 0 || !API_CONFIG.YOUTUBE_API_KEY) return [];

  const channelResults = await Promise.allSettled(
    channels.slice(0, 4).map((channel) => fetchChannelVideos(channel, maxPerChannel))
  );

  return channelResults.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

async function discoverChannels(
  queries: string[],
  stateName: string,
  districtName: string,
  localityName?: string
): Promise<LocalChannel[]> {
  const results = await Promise.allSettled(queries.map((query) => searchYouTubeChannels(query, 3)));
  return results.flatMap((result) => {
    if (result.status !== 'fulfilled') return [];
    return result.value.map((channel) => ({
      ...channel,
      state: stateName,
      district: districtName,
      locality: localityName,
      language: 'hi' as const,
      priority: 20,
    }));
  });
}

async function searchYouTubeChannels(query: string, maxResults = 3): Promise<LocalChannel[]> {
  if (!API_CONFIG.YOUTUBE_API_KEY) return [];

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'channel',
    regionCode: 'IN',
    relevanceLanguage: 'hi',
    maxResults: String(maxResults),
    key: API_CONFIG.YOUTUBE_API_KEY,
  });

  try {
    const res = await fetchWithTimeout(`${YOUTUBE_API_BASE}/search?${params.toString()}`, {
      timeoutMs: 9000,
      retries: 1,
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items || [])
      .map((item: YouTubeSearchItem): LocalChannel => ({
        id: item.id?.channelId || item.snippet?.channelId || '',
        name: item.snippet?.title || '',
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        description: item.snippet?.description || '',
        state: '',
        language: 'hi',
      }))
      .filter((channel: LocalChannel) => channel.id && channel.name);
  } catch {
    return [];
  }
}

async function fetchChannelVideos(channel: LocalChannel, maxResults: number): Promise<NewsItem[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId: channel.id,
    order: 'date',
    type: 'video',
    maxResults: String(Math.min(maxResults, 10)),
    key: API_CONFIG.YOUTUBE_API_KEY,
  });

  try {
    const res = await fetchWithTimeout(`${YOUTUBE_API_BASE}/search?${params.toString()}`, {
      timeoutMs: 9000,
      retries: 1,
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items || [])
      .map((item: YouTubeSearchItem): NewsItem => {
        const videoId = item.id?.videoId || '';
        return {
          id: `ytch_${videoId}`,
          title: item.snippet?.title || 'Untitled video',
          description: item.snippet?.description || '',
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            '',
          channelName: item.snippet?.channelTitle || channel.name,
          channelId: channel.id,
          channelType: channel.sourceId ? 'local_registry' : 'local_discovery',
          language: channel.language,
          publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
          url: `https://www.youtube.com/watch?v=${videoId}`,
          videoId,
          source: 'youtube',
          trustLevel: 'youtube',
          hasDoc: false,
          category: 'state',
        };
      })
      .filter((item: NewsItem) => Boolean(item.videoId));
  } catch {
    return [];
  }
}

function sourceToChannel(source: LocalYouTubeSource, districtName: string, localityName?: string): LocalChannel {
  return {
    id: source.youtube.channelId || '',
    name: source.name,
    state: source.state,
    district: source.districts?.[0] || districtName,
    locality: source.localities?.[0] || localityName,
    language: source.language,
    sourceId: source.id,
    priority: source.priority,
  };
}

function dedupeChannels(channels: LocalChannel[]): LocalChannel[] {
  const seen = new Set<string>();
  return channels
    .filter((channel) => {
      const key = channel.id || channel.name.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

function buildCacheKey(prefix: string, stateName: string, districtName: string, localityName?: string): string {
  return [prefix, stateName, districtName, localityName || '']
    .join('_')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
}
