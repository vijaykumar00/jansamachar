// JanSamachar — Personalization Engine (v3 — Hyperlocal Bubble)
// News order: Rajgarh → Sirmour district → Himachal Pradesh → India → World
// Sources: Local YT channels + YouTube search + NewsData.io

import type { UserProfile } from '../store/userProfileStore';
import type { NewsItem } from './newsService';
import { PROFESSIONS, INTERESTS } from '../constants/professions';
import { searchYouTubeNews, ytSearchToNewsItem } from './youtubeSearchService';
import { fetchDistrictNews, fetchStateNews, fetchNationalNews, fetchProfessionNews, toNewsItem } from './newsDataService';
import { fetchLocalChannelNews } from './localChannelService';

export interface FeedSection {
  id: string;
  title: string;
  titleHi: string;
  emoji: string;
  items: NewsItem[];
  geoLevel: 'district' | 'state' | 'national' | 'profession' | 'interest' | 'local';
  isNearYou?: boolean; // highlight the first district section
}

/**
 * Build the personalized news feed for a user.
 *
 * Section order (closest first — the "bubble"):
 *   1. 📍 [District] local channels (e.g. Rajgarh channels from HP)
 *   2. 📍 [District] YouTube search results (e.g. "Rajgarh Sirmour news")
 *   3. 🏘️ [District] + State on NewsData.io (district-level articles)
 *   4. 🗺️ [State] YouTube search (e.g. "Himachal Pradesh news")
 *   5. 🗺️ [State] NewsData.io state articles
 *   6. 🇮🇳 National India news (top headlines)
 *   7. 👨‍🌾 Profession-specific (e.g. Kisan keywords)
 *   8. 🎯 Interest-specific (e.g. Agriculture, Education)
 */
export async function buildPersonalizedFeed(profile: UserProfile): Promise<FeedSection[]> {
  const lang = profile.language === 'both' ? 'hi,en' : profile.language;
  const profession = PROFESSIONS.find(p => p.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];
  const district = profile.districtName;
  const state = profile.stateName;
  const locality = profile.localityName || '';

  // Fetch ALL sources in parallel for speed
  const [
    localChannelNews,
    districtYT,
    districtNewsData,
    stateYT,
    stateNewsData,
    nationalNewsData,
    professionNewsData,
    professionYT,
    interestYT,
  ] = await Promise.allSettled([
    // 1. Local channels (pre-known + dynamically discovered for this district/state)
    fetchLocalChannelNews(district, state, 5, locality),
    // 2. District YouTube search (hyperlocal)
    searchYouTubeNews(`"${locality || district}" "${district}" "${state}" news latest`, 8),
    // 3. District NewsData.io
    fetchDistrictNews(district, state, lang),
    // 4. State YouTube search
    searchYouTubeNews(`${state} news today latest`, 8),
    // 5. State NewsData.io
    fetchStateNews(state, lang),
    // 6. National top
    fetchNationalNews(lang),
    // 7. Profession keywords on NewsData.io
    fetchProfessionNews(profession.keywords, lang),
    // 8. Profession YouTube
    searchYouTubeNews(`${profession.keywords[0]} India 2025`, 6),
    // 9. First interest YouTube
    profile.interests.length > 0
      ? searchYouTubeNews((INTERESTS.find(i => i.id === profile.interests[0])?.keywords[0] || 'India news') + ' today', 6)
      : Promise.resolve([]),
  ]);

  const get = <T>(result: PromiseSettledResult<T[]>): T[] =>
    result.status === 'fulfilled' ? result.value : [];

  const sections: FeedSection[] = [];

  // ── SECTION 1 + 2: District (merged local channels + YT search) ─────────
  const districtItems = [
    ...get(localChannelNews),
    ...get(districtYT).map(ytSearchToNewsItem),
    ...get(districtNewsData).map(toNewsItem),
  ].filter(dedupeById());

  if (districtItems.length > 0) {
    sections.push({
      id: 'district',
      title: `${district} News`,
      titleHi: `${district} की खबरें`,
      emoji: '📍',
      items: districtItems.slice(0, 12),
      geoLevel: 'district',
      isNearYou: true, // First section = "Near You" badge
    });
  }

  // ── SECTION 3: State ─────────────────────────────────────────────────────
  const stateItems = [
    ...get(stateYT).map(ytSearchToNewsItem),
    ...get(stateNewsData).map(toNewsItem),
  ].filter(dedupeById());

  if (stateItems.length > 0) {
    sections.push({
      id: 'state',
      title: state,
      titleHi: `${state} समाचार`,
      emoji: '🗺️',
      items: stateItems.slice(0, 12),
      geoLevel: 'state',
    });
  }

  // ── SECTION 4: National ──────────────────────────────────────────────────
  const nationalItems = get(nationalNewsData).map(toNewsItem);
  if (nationalItems.length > 0) {
    sections.push({
      id: 'national',
      title: 'National',
      titleHi: 'राष्ट्रीय समाचार',
      emoji: '🇮🇳',
      items: nationalItems.slice(0, 10),
      geoLevel: 'national',
    });
  }

  // ── SECTION 5: Profession-specific ──────────────────────────────────────
  const professionItems = [
    ...get(professionNewsData).map(toNewsItem),
    ...get(professionYT).map(ytSearchToNewsItem),
  ].filter(dedupeById());

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

  // ── SECTION 6: Interest-based ────────────────────────────────────────────
  const interestItems = get(interestYT).map(ytSearchToNewsItem);
  const interestDef = INTERESTS.find(i => i.id === profile.interests[0]);

  if (interestItems.length > 0 && interestDef) {
    sections.push({
      id: 'interest',
      title: interestDef.label,
      titleHi: interestDef.labelHi,
      emoji: interestDef.emoji,
      items: interestItems.slice(0, 8),
      geoLevel: 'interest',
    });
  }

  return sections;
}

/** Deduplicator by item.id */
function dedupeById() {
  const seen = new Set<string>();
  return (item: any) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  };
}

/** Time-aware Hindi greeting */
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'शुभ रात्रि 🌙';
  if (h < 12) return 'शुभ प्रभात 🌅';
  if (h < 17) return 'नमस्ते 🙏';
  if (h < 20) return 'शुभ संध्या 🌆';
  return 'शुभ रात्रि 🌙';
}
