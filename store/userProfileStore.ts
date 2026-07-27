// JanSamachar — User Profile Store (Zustand + AsyncStorage)
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import type { ProfessionId, AgeGroup, Language } from '../constants/professions';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface UserProfile {
  // Onboarding completed?
  onboardingDone: boolean;
  // Who are you?
  profession: ProfessionId;
  ageGroup: AgeGroup;
  // Where are you?
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  // What do you like?
  interests: string[];
  // Language
  language: Language;
  // Reading and delivery preferences
  themePreference: ThemePreference;
  notificationBudgetPerDay: number;
  breakingAlerts: boolean;
  dataSaver: boolean;
  videoAutoplay: boolean;
  readerFontScale: number;
  // Greeting name (optional, from auth)
  displayName?: string;
}

interface ProfileStore {
  profile: UserProfile;
  isLoaded: boolean;
  setProfile: (patch: Partial<UserProfile>) => void;
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<void>;
  resetProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  onboardingDone: false,
  profession: 'other',
  ageGroup: '26-35',
  stateId: 'dl',
  stateName: 'Delhi',
  districtId: 'newdelhi',
  districtName: 'New Delhi',
  interests: ['politics', 'economy', 'accountability'],
  language: 'both',
  themePreference: 'system',
  notificationBudgetPerDay: 6,
  breakingAlerts: true,
  dataSaver: false,
  videoAutoplay: false,
  readerFontScale: 1,
};

const STORAGE_KEY = 'jansamachar_user_profile_v2';

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  isLoaded: false,

  setProfile: (patch) => {
    set((state) => ({ profile: { ...state.profile, ...patch } }));
    get().saveProfile();
  },

  loadProfile: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        set({ profile: { ...DEFAULT_PROFILE, ...parsed }, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  saveProfile: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().profile));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  },

  resetProfile: () => {
    set({ profile: DEFAULT_PROFILE });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

export function useResolvedColorScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const preference = useProfileStore((state) => state.profile.themePreference);

  if (preference === 'light' || preference === 'dark') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}
