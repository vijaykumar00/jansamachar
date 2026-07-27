import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EngagementStory {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  channelName: string;
  publishedAt: string;
  url?: string;
  videoId?: string;
  source: string;
  trustLevel: string;
  category?: string;
  aiSummary?: string;
  savedAt?: string;
  viewedAt?: string;
}

interface EngagementStore {
  savedItems: EngagementStory[];
  historyItems: EngagementStory[];
  isLoaded: boolean;
  loadEngagement: () => Promise<void>;
  saveStory: (story: EngagementStory) => void;
  removeSavedStory: (storyId: string) => void;
  toggleSavedStory: (story: EngagementStory) => boolean;
  addHistory: (story: EngagementStory) => void;
  clearHistory: () => void;
  isSaved: (storyId: string) => boolean;
}

const STORAGE_KEY = 'jansamachar_engagement_v1';
const MAX_SAVED_ITEMS = 80;
const MAX_HISTORY_ITEMS = 80;

interface StoredEngagement {
  savedItems: EngagementStory[];
  historyItems: EngagementStory[];
}

function compactStory(story: EngagementStory): EngagementStory {
  return {
    id: story.id,
    title: story.title,
    description: story.description || '',
    thumbnailUrl: story.thumbnailUrl || '',
    channelName: story.channelName || 'JanSamachar',
    publishedAt: story.publishedAt || new Date().toISOString(),
    url: story.url || '',
    videoId: story.videoId || '',
    source: story.source || 'rss',
    trustLevel: story.trustLevel || 'verified',
    category: story.category || '',
    aiSummary: story.aiSummary || '',
    savedAt: story.savedAt,
    viewedAt: story.viewedAt,
  };
}

function dedupeWithLatest(stories: EngagementStory[], dateKey: 'savedAt' | 'viewedAt') {
  const seen = new Set<string>();
  return stories
    .filter((story) => story.id && story.title)
    .sort((a, b) => new Date(b[dateKey] || 0).getTime() - new Date(a[dateKey] || 0).getTime())
    .filter((story) => {
      if (seen.has(story.id)) return false;
      seen.add(story.id);
      return true;
    });
}

export const useEngagementStore = create<EngagementStore>((set, get) => ({
  savedItems: [],
  historyItems: [],
  isLoaded: false,

  loadEngagement: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        set({ isLoaded: true });
        return;
      }

      const parsed = JSON.parse(stored) as Partial<StoredEngagement>;
      set({
        savedItems: dedupeWithLatest((parsed.savedItems || []).map(compactStory), 'savedAt').slice(0, MAX_SAVED_ITEMS),
        historyItems: dedupeWithLatest((parsed.historyItems || []).map(compactStory), 'viewedAt').slice(0, MAX_HISTORY_ITEMS),
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  saveStory: (story) => {
    const savedStory = compactStory({ ...story, savedAt: new Date().toISOString() });
    set((state) => ({
      savedItems: [savedStory, ...state.savedItems.filter((item) => item.id !== savedStory.id)].slice(0, MAX_SAVED_ITEMS),
    }));
    void persistEngagement();
  },

  removeSavedStory: (storyId) => {
    set((state) => ({ savedItems: state.savedItems.filter((item) => item.id !== storyId) }));
    void persistEngagement();
  },

  toggleSavedStory: (story) => {
    const alreadySaved = get().isSaved(story.id);
    if (alreadySaved) {
      get().removeSavedStory(story.id);
      return false;
    }
    get().saveStory(story);
    return true;
  },

  addHistory: (story) => {
    const historyStory = compactStory({ ...story, viewedAt: new Date().toISOString() });
    set((state) => ({
      historyItems: [historyStory, ...state.historyItems.filter((item) => item.id !== historyStory.id)].slice(0, MAX_HISTORY_ITEMS),
    }));
    void persistEngagement();
  },

  clearHistory: () => {
    set({ historyItems: [] });
    void persistEngagement();
  },

  isSaved: (storyId) => get().savedItems.some((item) => item.id === storyId),
}));

async function persistEngagement() {
  const { savedItems, historyItems } = useEngagementStore.getState();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ savedItems, historyItems }));
  } catch (e) {
    console.warn('Failed to save engagement data:', e);
  }
}
