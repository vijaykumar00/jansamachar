// JanSamachar — Trusted News Sources Configuration
// Curated list of independent, non-godi media channels

export const TRUSTED_YOUTUBE_CHANNELS = [
  {
    id: 'UCxS1tE3hXN8YJ4vB71_V12Q',
    name: 'Unfiltered by Samdish',
    handle: '@UNFILTEREDbySamdish',
    type: 'investigative',
    language: 'en',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFKY4KpbEYhx5f2hCmWH_-TzNp0NrpLGC_SWWbQ=s176-c-k-c0x00ffffff-no-rj',
  },
  {
    id: 'UChWtJey46brNr7qHQpN6KLQ',
    name: 'The Wire',
    handle: '@TheWireNews',
    type: 'journalism',
    language: 'en',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFKb_Pf3WELxgOp3dXiLMvOijfVEY5rJQ1HlQYw=s176-c-k-c0x00ffffff-no-rj',
  },
  {
    id: 'UC3x198n54q68_v242G51_pw',
    name: 'Newslaundry',
    handle: '@newslaundry',
    type: 'media_criticism',
    language: 'en',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFKbG5JQjBrH_rBkLN3Ql8tJbm6L9L2OqlGfqgg=s176-c-k-c0x00ffffff-no-rj',
  },
  {
    id: 'UC0yXUUIaPVAqZLgRjvtMftw',
    name: 'Ravish Kumar',
    handle: '@ravishkumar.official',
    type: 'ground_reality',
    language: 'hi',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFKbyM9g=s176-c-k-c0x00ffffff-no-rj',
  },
  {
    id: 'UCdDjoZAtt6PjQKAbr2FTOAQ',
    name: 'Alt News',
    handle: '@AltNewsVideos',
    type: 'fact_check',
    language: 'en',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFKZz8=s176-c-k-c0x00ffffff-no-rj',
  },
  {
    id: 'UCSaf-7p3J_N-02p7jHzm5tA',
    name: 'The Quint',
    handle: '@TheQuint',
    type: 'journalism',
    language: 'en',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFK=s176-c-k-c0x00ffffff-no-rj',
  },
  {
    id: 'UC-CSyyi47VX1lD9zyeABW3w',
    name: 'Dhruv Rathee',
    handle: '@dhruvrathee',
    type: 'analysis',
    language: 'hi',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFKbG=s176-c-k-c0x00ffffff-no-rj',
  },
  {
    id: 'UC14UjJk80s5t8F6zVqP-o3A',
    name: 'The Lallantop',
    handle: '@TheLallantop',
    type: 'youth_news',
    language: 'hi',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFKb=s176-c-k-c0x00ffffff-no-rj',
  },
  {
    id: 'UCtr3249j4z4G1n-C_J3-86w',
    name: 'NDTV',
    handle: '@NDTV',
    type: 'mainstream_independent',
    language: 'en',
    logo: 'https://yt3.googleusercontent.com/ytc/APkrFKb=s176-c-k-c0x00ffffff-no-rj',
  },
];

export const RSS_FEEDS = [
  {
    name: 'The Wire',
    url: 'https://thewire.in/feed/',
    language: 'en',
    type: 'journalism',
  },
  {
    name: 'Scroll.in',
    url: 'https://scroll.in/feed',
    language: 'en',
    type: 'journalism',
  },
  {
    name: 'The Print',
    url: 'https://theprint.in/feed/',
    language: 'en',
    type: 'journalism',
  },
  {
    name: 'Newslaundry',
    url: 'https://www.newslaundry.com/feed',
    language: 'en',
    type: 'media_criticism',
  },
  {
    name: 'The News Minute',
    url: 'https://www.thenewsminute.com/feed',
    language: 'en',
    type: 'regional',
  },
  {
    name: 'Alt News',
    url: 'https://www.altnews.in/feed',
    language: 'en',
    type: 'fact_check',
  },
];

export const GOVERNMENT_FEEDS = [
  {
    name: 'PIB English',
    url: 'https://pib.gov.in/RssFeed.aspx?Lang=1',
    language: 'en',
    type: 'official',
  },
  {
    name: 'PIB Hindi',
    url: 'https://pib.gov.in/RssFeed.aspx?Lang=2',
    language: 'hi',
    type: 'official',
  },
];

export const NEWS_CATEGORIES = [
  { id: 'all', label: 'सभी | All', labelHi: 'सभी', labelEn: 'All' },
  { id: 'politics', label: 'राजनीति | Politics', labelHi: 'राजनीति', labelEn: 'Politics' },
  { id: 'accountability', label: 'जवाबदेही | Accountability', labelHi: 'जवाबदेही', labelEn: 'Accountability' },
  { id: 'economy', label: 'अर्थव्यवस्था | Economy', labelHi: 'अर्थव्यवस्था', labelEn: 'Economy' },
  { id: 'court', label: 'न्यायालय | Court', labelHi: 'न्यायालय', labelEn: 'Court' },
  { id: 'state', label: 'राज्य | State', labelHi: 'राज्य', labelEn: 'State News' },
  { id: 'fact_check', label: 'फैक्ट चेक | Fact Check', labelHi: 'फैक्ट चेक', labelEn: 'Fact Check' },
  { id: 'environment', label: 'पर्यावरण | Environment', labelHi: 'पर्यावरण', labelEn: 'Environment' },
];

// RSS to JSON proxy — free, 10k req/day
export const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

// YouTube Data API v3 base URL
export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// GDELT free news API (no key needed)
export const GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc';
