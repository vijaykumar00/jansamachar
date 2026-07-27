export type LocalSourceTrust = 'official_link' | 'public_directory' | 'search_discovery';

export interface LocalYouTubeSource {
  id: string;
  name: string;
  state: string;
  districts?: string[];
  localities?: string[];
  language: 'hi' | 'en' | 'regional';
  priority: number;
  trust: LocalSourceTrust;
  youtube: {
    channelId?: string;
    handle?: string;
    searchQuery?: string;
  };
  websiteUrl?: string;
  notes?: string;
}

export interface LocalSourceMatchInput {
  stateName: string;
  districtName?: string;
  localityName?: string;
}

const LOCATION_ALIASES: Record<string, string> = {
  sirmour: 'sirmaur',
  sirmaur: 'sirmaur',
};

export const LOCAL_YOUTUBE_SOURCES: LocalYouTubeSource[] = [
  {
    id: 'himachal-darpan-live-tv',
    name: 'Himachal Darpan Live TV',
    state: 'Himachal Pradesh',
    districts: ['Sirmaur', 'Sirmour'],
    localities: ['Rajgarh'],
    language: 'hi',
    priority: 100,
    trust: 'official_link',
    youtube: {
      channelId: 'UC4QApOYc1hiyxO8ZcDDDg2A',
    },
    websiteUrl: 'https://himachaldarpanlivetv.com/',
    notes: 'Official site links to this YouTube channel and publishes Rajgarh/Sirmaur coverage.',
  },
  {
    id: 'himachal-today-tv',
    name: 'Himachal Today TV',
    state: 'Himachal Pradesh',
    language: 'hi',
    priority: 70,
    trust: 'official_link',
    youtube: {
      channelId: 'UCbk0x0GzkhP2qOg8pn0mmgw',
      handle: '@HimachalTodayTV',
    },
    websiteUrl: 'https://www.himachaltoday.in/',
    notes: 'State-level Himachal source with YouTube link published on its about page.',
  },
  {
    id: 'himachal-watcher',
    name: 'Himachal Watcher',
    state: 'Himachal Pradesh',
    language: 'en',
    priority: 55,
    trust: 'public_directory',
    youtube: {
      channelId: 'UCCORFz6AZBDTvPHZNEptiIw',
      handle: '@himachalwatcher',
    },
    websiteUrl: 'https://himachalwatcher.com/',
    notes: 'State-level Himachal source; channel ID is from public YouTube analytics listing.',
  },
  {
    id: 'new-himachal-live-tv',
    name: 'New Himachal Live TV',
    state: 'Himachal Pradesh',
    language: 'hi',
    priority: 50,
    trust: 'public_directory',
    youtube: {
      channelId: 'UCI7NVxjyukqYF0erJ-I7CCg',
      handle: '@newhimachallivetv',
    },
    notes: 'State-level Himachal channel from public YouTube analytics listing.',
  },
  {
    id: 'live-times-tv',
    name: 'Live Times TV',
    state: 'Himachal Pradesh',
    language: 'hi',
    priority: 45,
    trust: 'search_discovery',
    youtube: {
      searchQuery: 'Live Times TV Himachal Pradesh news channel',
    },
    websiteUrl: 'https://livetimestvhosting.livebox.co.in/',
    notes: 'Website says the outlet publishes on YouTube; resolve via YouTube channel search.',
  },
];

export function getMatchingLocalYouTubeSources(input: LocalSourceMatchInput): LocalYouTubeSource[] {
  const state = normalizeLocation(input.stateName);
  const district = normalizeLocation(input.districtName || '');
  const locality = normalizeLocation(input.localityName || '');

  return LOCAL_YOUTUBE_SOURCES
    .filter((source) => {
      if (normalizeLocation(source.state) !== state) return false;

      const sourceDistricts = (source.districts || []).map(normalizeLocation);
      const sourceLocalities = (source.localities || []).map(normalizeLocation);

      if (sourceDistricts.length > 0) {
        return sourceDistricts.includes(district) || sourceDistricts.includes(locality);
      }

      if (sourceLocalities.length > 0) {
        return sourceLocalities.includes(locality) || sourceLocalities.includes(district);
      }

      return true;
    })
    .sort((a, b) => sourceSpecificity(b) - sourceSpecificity(a) || b.priority - a.priority);
}

export function buildLocalYouTubeDiscoveryQueries(input: LocalSourceMatchInput): string[] {
  const parts = [input.localityName, input.districtName, input.stateName].filter(Boolean);
  const scopedLocation = parts.join(' ');
  const queries = [
    `${scopedLocation} local news channel`,
    `${scopedLocation} news samachar`,
    `${input.districtName || input.localityName || input.stateName} ${input.stateName} news live`,
  ];

  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
}

function sourceSpecificity(source: LocalYouTubeSource): number {
  if (source.localities?.length) return 3;
  if (source.districts?.length) return 2;
  return 1;
}

function normalizeLocation(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return LOCATION_ALIASES[normalized] || normalized;
}
