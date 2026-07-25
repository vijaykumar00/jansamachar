// JanSamachar — India Geographic Data Service
//
// Data Source: sab99r/Indian-States-And-Districts (GitHub)
// CDN: https://cdn.jsdelivr.net/gh/sab99r/Indian-States-And-Districts@master/states-and-districts.json
// ✅ FREE — No API key needed
// ✅ COMPLETE — All 28 states + 8 UTs with every district
// ✅ FAST — Only ~15KB total (gzipped ~3KB)
// ✅ CACHED — Stored in AsyncStorage for 7 days, no repeated downloads

import AsyncStorage from '@react-native-async-storage/async-storage';

const CDN_URL =
  'https://cdn.jsdelivr.net/gh/sab99r/Indian-States-And-Districts@master/states-and-districts.json';

const CACHE_KEY = 'jansamachar_geo_data_v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface GeoDistrict {
  id: string;   // lowercase slug: "mumbai-city"
  name: string; // "Mumbai City"
}

export interface GeoState {
  id: string;      // lowercase slug: "maharashtra"
  name: string;    // "Maharashtra"
  districts: GeoDistrict[];
}

interface CacheEntry {
  data: GeoState[];
  fetchedAt: number;
}

// In-memory cache so we don't hit AsyncStorage on every render
let memCache: GeoState[] | null = null;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseRaw(raw: { states: { state: string; districts: string[] }[] }): GeoState[] {
  return raw.states.map((s) => ({
    id: slugify(s.state),
    name: s.state,
    districts: s.districts.map((d) => ({
      id: slugify(d),
      name: d,
    })),
  }));
}

/**
 * Returns the complete India state → district list.
 * Fetches from CDN on first use, then caches in AsyncStorage for 7 days.
 * In-memory cache avoids repeated AsyncStorage reads within the same session.
 */
export async function getIndiaGeoData(): Promise<GeoState[]> {
  // 1. In-memory cache hit
  if (memCache) return memCache;

  // 2. AsyncStorage cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      const age = Date.now() - entry.fetchedAt;
      if (age < CACHE_TTL_MS) {
        memCache = entry.data;
        return memCache;
      }
    }
  } catch {
    // Cache read failed — continue to fetch
  }

  // 3. Fetch from CDN
  try {
    console.log('[GeoService] Fetching India geo data from CDN...');
    const res = await fetch(CDN_URL);
    if (!res.ok) throw new Error(`CDN returned ${res.status}`);
    const raw = await res.json();
    const data = parseRaw(raw);

    // Save to AsyncStorage
    const entry: CacheEntry = { data, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));

    memCache = data;
    console.log(`[GeoService] Loaded ${data.length} states successfully`);
    return data;
  } catch (e) {
    console.warn('[GeoService] CDN fetch failed, using fallback:', e);
    // Return minimal fallback so app doesn't break completely
    return FALLBACK_STATES;
  }
}

/**
 * Get districts for a specific state by its slug ID.
 * e.g. getDistrictsForState("uttar-pradesh")
 */
export async function getDistrictsForState(stateId: string): Promise<GeoDistrict[]> {
  const states = await getIndiaGeoData();
  const state = states.find((s) => s.id === stateId);
  return state?.districts ?? [];
}

/**
 * Search states by name prefix (for autocomplete)
 */
export async function searchStates(query: string): Promise<GeoState[]> {
  const states = await getIndiaGeoData();
  const q = query.toLowerCase();
  return states.filter((s) => s.name.toLowerCase().includes(q));
}

// ─── Minimal fallback (if CDN is unreachable) ───────────────────────────────
// Only the biggest states — enough to unblock the app offline
const FALLBACK_STATES: GeoState[] = [
  { id: 'uttar-pradesh', name: 'Uttar Pradesh', districts: [
    { id: 'lucknow', name: 'Lucknow' }, { id: 'varanasi', name: 'Varanasi' },
    { id: 'kanpur-nagar', name: 'Kanpur Nagar' }, { id: 'agra', name: 'Agra' },
    { id: 'prayagraj', name: 'Prayagraj' }, { id: 'gorakhpur', name: 'Gorakhpur' },
  ]},
  { id: 'maharashtra', name: 'Maharashtra', districts: [
    { id: 'mumbai-city', name: 'Mumbai City' }, { id: 'pune', name: 'Pune' },
    { id: 'nagpur', name: 'Nagpur' }, { id: 'nashik', name: 'Nashik' },
    { id: 'thane', name: 'Thane' },
  ]},
  { id: 'bihar', name: 'Bihar', districts: [
    { id: 'patna', name: 'Patna' }, { id: 'gaya', name: 'Gaya' },
    { id: 'muzaffarpur', name: 'Muzaffarpur' }, { id: 'bhagalpur', name: 'Bhagalpur' },
  ]},
  { id: 'delhi', name: 'Delhi', districts: [
    { id: 'new-delhi', name: 'New Delhi' }, { id: 'south-delhi', name: 'South Delhi' },
    { id: 'north-delhi', name: 'North Delhi' }, { id: 'east-delhi', name: 'East Delhi' },
  ]},
  { id: 'madhya-pradesh', name: 'Madhya Pradesh', districts: [
    { id: 'bhopal', name: 'Bhopal' }, { id: 'indore', name: 'Indore' },
    { id: 'gwalior', name: 'Gwalior' }, { id: 'jabalpur', name: 'Jabalpur' },
  ]},
  { id: 'rajasthan', name: 'Rajasthan', districts: [
    { id: 'jaipur', name: 'Jaipur' }, { id: 'jodhpur', name: 'Jodhpur' },
    { id: 'udaipur', name: 'Udaipur' }, { id: 'kota', name: 'Kota' },
  ]},
  { id: 'west-bengal', name: 'West Bengal', districts: [
    { id: 'kolkata', name: 'Kolkata' }, { id: 'howrah', name: 'Howrah' },
    { id: 'darjeeling', name: 'Darjeeling' },
  ]},
  { id: 'karnataka', name: 'Karnataka', districts: [
    { id: 'bengaluru-urban', name: 'Bengaluru Urban' }, { id: 'mysuru', name: 'Mysuru' },
    { id: 'mangaluru', name: 'Mangaluru' },
  ]},
  { id: 'tamil-nadu', name: 'Tamil Nadu', districts: [
    { id: 'chennai', name: 'Chennai' }, { id: 'coimbatore', name: 'Coimbatore' },
    { id: 'madurai', name: 'Madurai' },
  ]},
  { id: 'gujarat', name: 'Gujarat', districts: [
    { id: 'ahmedabad', name: 'Ahmedabad' }, { id: 'surat', name: 'Surat' },
    { id: 'vadodara', name: 'Vadodara' },
  ]},
];
