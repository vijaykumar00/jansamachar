import type { UserProfile } from '../store/userProfileStore';
import { INTERESTS, PROFESSIONS } from '../constants/professions';
import { searchYouTubeNews, ytSearchToNewsItem } from './youtubeSearchService';
import {
  fetchDistrictNews,
  fetchNationalNews,
  fetchProfessionNews,
  fetchStateNews,
  toNewsItem,
} from './newsDataService';

export interface FeedSection {
  id: string;
  title: string;
  titleHi: string;
  emoji: string;
  items: any[];
  geoLevel: 'district' | 'state' | 'national' | 'profession' | 'interest';
}

export async function buildPersonalizedFeed(profile: UserProfile): Promise<FeedSection[]> {
  const lang = profile.language === 'both' ? 'hi,en' : profile.language;
  const profession = PROFESSIONS.find((p) => p.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];

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
    fetchDistrictNews(profile.districtName, profile.stateName, lang),
    searchYouTubeNews(`${profile.districtName} ${profile.stateName} news today`, 8),
    fetchStateNews(profile.stateName, lang),
    searchYouTubeNews(`${profile.stateName} news latest`, 6),
    fetchNationalNews(lang),
    fetchProfessionNews(profession.keywords, lang),
    searchYouTubeNews(`${profession.keywords[0]} latest news`, 8),
    profile.interests.length > 0
      ? searchYouTubeNews(`${INTERESTS.find((i) => i.id === profile.interests[0])?.keywords[0] || 'India news'} today`, 6)
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

  const nationalItems = nationalNewsData.status === 'fulfilled' ? nationalNewsData.value.map(toNewsItem) : [];

  const professionItems = [
    ...(professionNewsData.status === 'fulfilled' ? professionNewsData.value.map(toNewsItem) : []),
    ...(professionYT.status === 'fulfilled' ? professionYT.value.map(ytSearchToNewsItem) : []),
  ];

  const interestItems = interestResults.status === 'fulfilled'
    ? (interestResults.value as any[]).map(ytSearchToNewsItem)
    : [];

  const interestLabel = profile.interests[0]
    ? INTERESTS.find((i) => i.id === profile.interests[0])
    : null;

  const sections: FeedSection[] = [];

  if (districtItems.length > 0) {
    sections.push({
      id: 'district',
      title: `${profile.districtName} News`,
      titleHi: `${profile.districtName} की खबरें`,
      emoji: '⌖',
      items: districtItems.slice(0, 10),
      geoLevel: 'district',
    });
  }

  if (stateItems.length > 0) {
    sections.push({
      id: 'state',
      title: `${profile.stateName}`,
      titleHi: `${profile.stateName} समाचार`,
      emoji: '◇',
      items: stateItems.slice(0, 10),
      geoLevel: 'state',
    });
  }

  sections.push({
    id: 'national',
    title: 'National',
    titleHi: 'राष्ट्रीय समाचार',
    emoji: 'IN',
    items: nationalItems.slice(0, 10),
    geoLevel: 'national',
  });

  if (professionItems.length > 0) {
    sections.push({
      id: 'profession',
      title: `For ${profession.label}`,
      titleHi: `${profession.labelHi} के लिए`,
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

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'शुभ प्रभात';
  if (hour < 17) return 'नमस्ते';
  if (hour < 20) return 'शुभ संध्या';
  return 'शुभ रात्रि';
}
