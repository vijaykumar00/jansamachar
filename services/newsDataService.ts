// JanSamachar — NewsData.io Service
// API: https://newsdata.io/api/1/latest
// Free: 200 credits/day, 10 articles/credit → ~2000 articles/day
// Supports: India, Hindi + English, category filter, keyword search

import { API_CONFIG } from '../constants/api';
import { trackEvent } from './analyticsService';
import { fetchWithTimeout } from './fetchService';
import { fetchProxyJson, hasBackendProxy } from './proxyClient';
import type { NewsItem } from './newsService';

const BASE = 'https://newsdata.io/api/1/latest';
const CACHE_TTL_MS = 3 * 60 * 1000;
const responseCache = new Map<string, { fetchedAt: number; data: NewsDataArticle[] }>();

export interface NewsDataArticle {
  id: string;
  article_id?: string;
  title: string;
  description: string | null;
  link: string;
  image_url: string | null;
  source_id: string;
  source_name: string;
  pubDate: string;
  language: string;
  category: string[];
  country: string[];
}

function stableArticleId(article: NewsDataArticle): string {
  const rawId = article.article_id || article.id;
  if (rawId) return `newsdata_${rawId}`;

  const uniqueSource = `${article.source_id}|${article.pubDate}|${article.link}|${article.title}`;
  let hash = 0;
  for (let i = 0; i < uniqueSource.length; i += 1) {
    hash = (hash * 31 + uniqueSource.charCodeAt(i)) >>> 0;
  }
  return `newsdata_${article.source_id || 'source'}_${article.pubDate || 'date'}_${hash.toString(36)}`;
}

interface NewsDataResponse {
  status: string;
  results: NewsDataArticle[];
  nextPage?: string;
}

function getCached(cacheKey: string): NewsDataArticle[] | null {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }
  return cached.data;
}

function setCached(cacheKey: string, data: NewsDataArticle[]) {
  responseCache.set(cacheKey, { fetchedAt: Date.now(), data });
}

/**
 * Fetch India news by keyword query
 * @param query  e.g. "Varanasi MSP kisan" or "JEE result 2025"
 * @param language  "hi" | "en" | "hi,en"
 */
export async function fetchNewsByQuery(
  query: string,
  language = 'hi,en',
  size = 10
): Promise<NewsDataArticle[]> {
  const cacheKey = `search:${query.slice(0, 100)}:${language}:${Math.min(size, 10)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (hasBackendProxy()) {
    try {
      const data = await fetchProxyJson<NewsDataResponse>('/newsdata/search', {
        query: query.slice(0, 100),
        language,
        size: Math.min(size, 10),
      });
      const results = data.results || [];
      setCached(cacheKey, results);
      return results;
    } catch (e) {
      void trackEvent('provider_fallback_used', { provider: 'newsdata_proxy', reason: 'provider_error' });
      console.warn('NewsData proxy failed:', e);
      return [];
    }
  }

  const params = new URLSearchParams({
    apikey: API_CONFIG.NEWSDATA_API_KEY,
    country: 'in',
    language,
    qInTitle: query.slice(0, 100), // max 100 chars
    size: String(Math.min(size, 10)),
  });

  try {
    const res = await fetchWithTimeout(`${BASE}?${params.toString()}`, { timeoutMs: 9000, retries: 1 });
    if (!res.ok) {
      const err = await res.text();
      void trackEvent('provider_fallback_used', { provider: 'newsdata', reason: String(res.status) });
      console.warn('NewsData error:', res.status, err);
      return [];
    }
    const data: NewsDataResponse = await res.json();
    const results = data.results || [];
    setCached(cacheKey, results);
    return results;
  } catch (e) {
    void trackEvent('provider_fallback_used', { provider: 'newsdata', reason: 'provider_error' });
    console.warn('NewsData fetch failed:', e);
    return [];
  }
}

/**
 * Fetch district-level news (hyperlocal)
 */
export async function fetchDistrictNews(
  districtName: string,
  stateName: string,
  language = 'hi,en'
): Promise<NewsDataArticle[]> {
  // Try district first, fallback to state
  const query = `${districtName} ${stateName}`;
  return fetchNewsByQuery(query, language);
}

/**
 * Fetch state-level news
 */
export async function fetchStateNews(stateName: string, language = 'hi,en'): Promise<NewsDataArticle[]> {
  return fetchNewsByQuery(stateName, language);
}

/**
 * Fetch profession-specific news
 */
export async function fetchProfessionNews(keywords: string[], language = 'hi,en'): Promise<NewsDataArticle[]> {
  const query = keywords[Math.floor(Math.random() * keywords.length)];
  return fetchNewsByQuery(query, language);
}

/**
 * Fetch national India top news
 */
export async function fetchNationalNews(language = 'hi,en'): Promise<NewsDataArticle[]> {
  const cacheKey = `latest:${language}:10`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (hasBackendProxy()) {
    try {
      const data = await fetchProxyJson<NewsDataResponse>('/newsdata/latest', {
        language,
        size: 10,
      });
      const results = data.results || [];
      setCached(cacheKey, results);
      return results;
    } catch {
      void trackEvent('provider_fallback_used', { provider: 'newsdata_proxy', reason: 'provider_error' });
      return [];
    }
  }

  const params = new URLSearchParams({
    apikey: API_CONFIG.NEWSDATA_API_KEY,
    country: 'in',
    language,
    size: '10',
  });
  try {
    const res = await fetchWithTimeout(`${BASE}?${params.toString()}`, { timeoutMs: 9000, retries: 1 });
    if (!res.ok) {
      void trackEvent('provider_fallback_used', { provider: 'newsdata', reason: String(res.status) });
      return [];
    }
    const data: NewsDataResponse = await res.json();
    const results = data.results || [];
    setCached(cacheKey, results);
    return results;
  } catch {
    void trackEvent('provider_fallback_used', { provider: 'newsdata', reason: 'provider_error' });
    return [];
  }
}

/** Convert NewsData article to our app's unified NewsItem format */
export function toNewsItem(article: NewsDataArticle): NewsItem {
  return {
    id: stableArticleId(article),
    title: article.title,
    description: article.description || '',
    thumbnailUrl: article.image_url || '',
    channelName: article.source_name || article.source_id,
    channelId: article.source_id,
    channelType: 'newsdata',
    language: article.language || 'en',
    publishedAt: article.pubDate,
    url: article.link,
    source: 'newsdata' as const,
    trustLevel: 'verified',
    hasDoc: false,
    category: article.category?.[0] || 'general',
  };
}
