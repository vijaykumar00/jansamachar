// JanSamachar — YouTube News Service
// Fetches latest videos from trusted Indian independent channels

import { TRUSTED_YOUTUBE_CHANNELS, YOUTUBE_API_BASE } from '../constants/sources';
import { API_CONFIG, DEMO_MODE } from '../constants/api';
import { MOCK_NEWS_ITEMS } from './mockData';
import { fetchWithTimeout } from './fetchService';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoId?: string;
  publishedAt: string;
  channelName: string;
  channelId: string;
  channelType: string;
  language: string;
  source: 'youtube' | 'rss' | 'citizen' | 'official' | 'newsdata';
  trustLevel: 'verified' | 'youtube' | 'citizen' | 'breaking' | 'official';
  hasDoc?: boolean;
  docUrl?: string;
  category?: string;
  url?: string;
  aiSummary?: string;
}

/**
 * Fetches latest videos from a single YouTube channel
 */
async function fetchChannelVideos(channelId: string, maxResults = 5): Promise<NewsItem[]> {
  if (!API_CONFIG.YOUTUBE_API_KEY || API_CONFIG.YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
    return [];
  }

  const url = `${YOUTUBE_API_BASE}/search?channelId=${channelId}&part=snippet&type=video&order=date&maxResults=${maxResults}&key=${API_CONFIG.YOUTUBE_API_KEY}`;

  try {
    const res = await fetchWithTimeout(url, { timeoutMs: 9000, retries: 1 });
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    const data = await res.json();

    const channel = TRUSTED_YOUTUBE_CHANNELS.find((c) => c.id === channelId);

    return (data.items || []).map((item: any): NewsItem => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      videoId: item.id.videoId,
      publishedAt: item.snippet.publishedAt,
      channelName: item.snippet.channelTitle || channel?.name || 'Unknown',
      channelId,
      channelType: channel?.type || 'journalism',
      language: channel?.language || 'en',
      source: 'youtube',
      trustLevel: 'youtube',
      hasDoc: false,
      category: mapChannelTypeToCategory(channel?.type || ''),
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (err) {
    console.warn(`Failed to fetch channel ${channelId}:`, err);
    return [];
  }
}

/**
 * Fetches RSS feed via rss2json proxy
 */
async function fetchRSSFeed(feedUrl: string, feedName: string): Promise<NewsItem[]> {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=10${API_CONFIG.RSS2JSON_KEY ? `&api_key=${API_CONFIG.RSS2JSON_KEY}` : ''}`;

  try {
    const res = await fetchWithTimeout(apiUrl, { timeoutMs: 9000, retries: 1 });
    if (!res.ok) throw new Error(`RSS2JSON error: ${res.status}`);
    const data = await res.json();

    if (data.status !== 'ok') throw new Error(data.message);

    return (data.items || []).map((item: any, i: number): NewsItem => ({
      id: `rss_${feedName}_${i}_${Date.now()}`,
      title: item.title,
      description: item.description?.replace(/<[^>]*>/g, '').substring(0, 300) || '',
      thumbnailUrl: item.thumbnail || item.enclosure?.link || '',
      publishedAt: item.pubDate,
      channelName: feedName,
      channelId: feedUrl,
      channelType: 'journalism',
      language: 'en',
      source: 'rss',
      trustLevel: 'verified',
      hasDoc: false,
      category: 'politics',
      url: item.link,
    }));
  } catch (err) {
    console.warn(`Failed to fetch RSS ${feedName}:`, err);
    return [];
  }
}

/**
 * Fetches news from GDELT (no API key needed, India focused)
 */
async function fetchGDELTNews(): Promise<NewsItem[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=india+news&mode=artlist&maxrecords=20&format=json&sourcelang=english&sourcecountry=india`;

  try {
    const res = await fetchWithTimeout(url, { timeoutMs: 9000, retries: 1 });
    if (!res.ok) throw new Error(`GDELT error: ${res.status}`);
    const data = await res.json();

    return (data.articles || []).slice(0, 10).map((article: any, i: number): NewsItem => ({
      id: `gdelt_${i}_${Date.now()}`,
      title: article.title || 'Untitled',
      description: article.seendate || '',
      thumbnailUrl: '',
      publishedAt: article.seendate || new Date().toISOString(),
      channelName: article.domain || 'News',
      channelId: article.domain || '',
      channelType: 'journalism',
      language: 'en',
      source: 'rss',
      trustLevel: 'verified',
      hasDoc: false,
      category: 'politics',
      url: article.url || '',
    }));
  } catch (err) {
    console.warn('GDELT fetch failed:', err);
    return [];
  }
}

function mapChannelTypeToCategory(type: string): string {
  const map: Record<string, string> = {
    investigative: 'accountability',
    journalism: 'politics',
    media_criticism: 'politics',
    ground_reality: 'state',
    fact_check: 'fact_check',
    analysis: 'politics',
    youth_news: 'politics',
    mainstream_independent: 'politics',
    regional: 'state',
  };
  return map[type] || 'politics';
}

/**
 * Main function: fetch news from all sources
 */
export async function fetchAllNews(): Promise<NewsItem[]> {
  if (DEMO_MODE) {
    // Return mock data in demo mode (works without API keys)
    return MOCK_NEWS_ITEMS;
  }

  const promises: Promise<NewsItem[]>[] = [];

  // Fetch from top 5 YouTube channels (to stay within quota)
  const priorityChannels = TRUSTED_YOUTUBE_CHANNELS.slice(0, 5);
  for (const channel of priorityChannels) {
    promises.push(fetchChannelVideos(channel.id, 4));
  }

  // Fetch from top 3 RSS feeds
  const { RSS_FEEDS } = await import('../constants/sources');
  for (const feed of RSS_FEEDS.slice(0, 3)) {
    promises.push(fetchRSSFeed(feed.url, feed.name));
  }

  // Fetch GDELT as fallback (no key needed)
  promises.push(fetchGDELTNews());

  const results = await Promise.allSettled(promises);
  const allNews: NewsItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
    }
  }

  // Sort by date, newest first
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return allNews;
}

export async function fetchNewsItemById(id: string): Promise<NewsItem | null> {
  const allNews = await fetchAllNews();
  return allNews.find((item) => item.id === id) || MOCK_NEWS_ITEMS.find((item) => item.id === id) || null;
}

/**
 * Fetch breaking news (uses NewsAPI)
 */
export async function fetchBreakingNews(): Promise<NewsItem[]> {
  if (DEMO_MODE) {
    return MOCK_NEWS_ITEMS.filter((_, i) => i < 5);
  }

  if (!API_CONFIG.NEWS_API_KEY || API_CONFIG.NEWS_API_KEY === 'YOUR_NEWS_API_KEY') {
    return [];
  }

  try {
    const res = await fetchWithTimeout(
      `https://newsapi.org/v2/top-headlines?country=in&apiKey=${API_CONFIG.NEWS_API_KEY}&pageSize=10`,
      { timeoutMs: 9000, retries: 1 }
    );
    const data = await res.json();
    return (data.articles || []).map((a: any, i: number): NewsItem => ({
      id: `breaking_${i}`,
      title: a.title,
      description: a.description || '',
      thumbnailUrl: a.urlToImage || '',
      publishedAt: a.publishedAt,
      channelName: a.source?.name || 'News',
      channelId: a.source?.id || '',
      channelType: 'journalism',
      language: 'en',
      source: 'rss',
      trustLevel: 'breaking',
      hasDoc: false,
      url: a.url,
    }));
  } catch {
    return [];
  }
}
