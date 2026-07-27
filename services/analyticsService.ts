import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnalyticsEventName =
  | 'app_opened'
  | 'story_viewed'
  | 'story_saved'
  | 'story_unsaved'
  | 'story_shared'
  | 'history_cleared'
  | 'search_performed'
  | 'provider_fallback_used'
  | 'external_link_blocked'
  | 'external_link_opened'
  | 'error_encountered';

type AnalyticsValue = string | number | boolean | undefined;
export type AnalyticsProperties = Record<string, AnalyticsValue>;

export interface AnalyticsEvent {
  id: string;
  name: AnalyticsEventName;
  timestamp: string;
  properties?: AnalyticsProperties;
}

const STORAGE_KEY = 'jansamachar_local_analytics_v1';
const MAX_EVENTS = 150;

function sanitizeProperties(properties?: AnalyticsProperties): AnalyticsProperties | undefined {
  if (!properties) return undefined;
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 80) : value])
  );
}

function makeEventId(name: AnalyticsEventName) {
  return `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function trackEvent(name: AnalyticsEventName, properties?: AnalyticsProperties) {
  const event: AnalyticsEvent = {
    id: makeEventId(name),
    name,
    timestamp: new Date().toISOString(),
    properties: sanitizeProperties(properties),
  };

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) as AnalyticsEvent[] : [];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([event, ...existing].slice(0, MAX_EVENTS)));
  } catch (e) {
    console.warn('Failed to track local analytics event:', e);
  }
}

export async function getLocalAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as AnalyticsEvent[] : [];
  } catch {
    return [];
  }
}

export async function clearLocalAnalyticsEvents() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear local analytics events:', e);
  }
}
