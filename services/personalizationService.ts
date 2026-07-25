// JanSamachar — Personalization Engine
// Generates smart search queries based on user profile (profession + location + interests)

import type { UserProfile } from '../store/userProfileStore';
import { PROFESSIONS, INTERESTS } from '../constants/professions';
import {
  searchYouTubeNews, ytSearchToNewsItem,
} from './youtubeSearchService';
import {
  fetchDistrictNews, fetchStateNews, fetchNationalNews,
  fetchProfessionNews, toNewsItem,
} from './newsDataService';

export interface FeedSection {
  id: string;
  title: string;
  titleHi: string;
  emoji: string;
  items: any[];
  geoLevel: 'district' | 'state' | 'national' | 'profession' | 'interest';
}

/**
 * Build the personalized news feed for a user.
 * Returns sections: district → state → national → profession-specific
 */
export async function buildPersonalizedFeed(profile: UserProfile): Promise<FeedSection[]> {
  const lang = profile.language === 'both' ? 'hi,en' : profile.language;
  const profession = PROFESSIONS.find(p => p.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];

  const sections: FeedSection[] = [];

  // Fetch all sections in parallel
  const [
    districtNewsData,
    districtYT,
    stateNewsData,
    stateYT,
    nationalNewsData,
    professionNewsData,
    professionYT,
    interestResults,
  ] = await Promise.allSettled([
    // 1. Hyperlocal: district NewsData.io
    fetchDistrictNews(profile.districtName, profile.stateName, lang),
    // 2. Hyperlocal: district YouTube search
    searchYouTubeNews(`${profile.districtName} ${profile.stateName} news आज`, 8),
    // 3. State: NewsData.io
    fetchStateNews(profile.stateName, lang),
    // 4. State: YouTube
    searchYouTubeNews(`${profile.stateName} news latest`, 6),
    // 5. National: NewsData.io top
    fetchNationalNews(lang),
    // 6. Profession: NewsData.io
    fetchProfessionNews(profession.keywords, lang),
    // 7. Profession: YouTube
    searchYouTubeNews(profession.keywords[0] + ' news 2025', 8),
    // 8. First interest: YouTube
    profile.interests.length > 0
      ? searchYouTubeNews((INTERESTS.find(i => i.id === profile.interests[0])?.keywords[0] || 'India news') + ' today', 6)
      : Promise.resolve([]),
  ]);

  const districtItems = [
    ...(districtNewsData.status === 'fulfilled' ? districtNewsData.value.map(toNewsItem) : []),
    ...(districtYT.status === 'fulfilled' ? districtYT.value.map(ytSearchToNewsItem) : []),
  ];

  const stateItems = [
    ...(stateNewsData.status === 'fulfilled' ? stateNewsData.value.map(toNewsItem) : []),
    ...(stateYT.status === 'fulfilled' ? stateYT.value.map(ytSearchToNewsItem) : []),
  ];

  const nationalItems = nationalNewsData.status === 'fulfilled'
    ? nationalNewsData.value.map(toNewsItem) : [];

  const professionItems = [
    ...(professionNewsData.status === 'fulfilled' ? professionNewsData.value.map(toNewsItem) : []),
    ...(professionYT.status === 'fulfilled' ? professionYT.value.map(ytSearchToNewsItem) : []),
  ];

  const interestItems = interestResults.status === 'fulfilled'
    ? (interestResults.value as any[]).map(ytSearchToNewsItem) : [];

  const interestLabel = profile.interests[0]
    ? INTERESTS.find(i => i.id === profile.interests[0]) : null;

  if (districtItems.length > 0) {
    sections.push({
      id: 'district',
      title: `${profile.districtName} News`,
      titleHi: `${profile.districtName} की खबरें`,
      emoji: '📍',
      items: districtItems.slice(0, 10),
      geoLevel: 'district',
    });
  }

  if (stateItems.length > 0) {
    sections.push({
      id: 'state',
      title: `${profile.stateName}`,
      titleHi: `${profile.stateName} समाचार`,
      emoji: '🗺️',
      items: stateItems.slice(0, 10),
      geoLevel: 'state',
    });
  }

  sections.push({
    id: 'national',
    title: 'National',
    titleHi: 'राष्ट्रीय समाचार',
    emoji: '🇮🇳',
    items: nationalItems.slice(0, 10),
    geoLevel: 'national',
  });

  if (professionItems.length > 0) {
    sections.push({
      id: 'profession',
      title: `For ${profession.label}`,
      titleHi: `${profession.labelHi} की खबरें`,
      emoji: profession.emoji,
      items: professionItems.slice(0, 10),
      geoLevel: 'profession',
    });
  }

  if (interestItems.length > 0 && interestLabel) {
    sections.push({
      id: 'interest',
      title: interestLabel.label,
      titleHi: interestLabel.labelHi,
      emoji: interestLabel.emoji,
      items: interestItems.slice(0, 8),
      geoLevel: 'interest',
    });
  }

  return sections;
}

/** Get a time-based greeting in Hindi */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'शुभ प्रभात 🌅';
  if (hour < 17) return 'नमस्ते 🙏';
  if (hour < 20) return 'शुभ संध्या 🌆';
  return 'शुभ रात्रि 🌙';
}
