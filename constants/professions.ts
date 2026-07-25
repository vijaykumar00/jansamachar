export type ProfessionId =
  | 'farmer'
  | 'student'
  | 'engineer'
  | 'govt'
  | 'business'
  | 'doctor'
  | 'teacher'
  | 'homemaker'
  | 'other';

export type AgeGroup = '18-25' | '26-35' | '36-50' | '50+';
export type Language = 'hi' | 'en' | 'both';

export interface Profession {
  id: ProfessionId;
  emoji: string;
  label: string;
  labelHi: string;
  keywords: string[];
  categories: string[];
  gradient: string[];
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'farmer',
    emoji: '🌾',
    label: 'Farmer',
    labelHi: 'किसान',
    keywords: ['MSP mandi kisan', 'fasal bima', 'PMKISAN', 'krishi news', 'crop price mandi'],
    categories: ['environment', 'business'],
    gradient: ['#0F5132', '#147D64'],
  },
  {
    id: 'student',
    emoji: '🎓',
    label: 'Student',
    labelHi: 'छात्र',
    keywords: ['UPSC result', 'JEE NEET news', 'board exam result', 'scholarship India'],
    categories: ['education'],
    gradient: ['#1E3A8A', '#2563EB'],
  },
  {
    id: 'engineer',
    emoji: '⚙️',
    label: 'Engineer / Tech',
    labelHi: 'इंजीनियर',
    keywords: ['India startup news', 'technology India', 'ISRO news', 'AI India policy'],
    categories: ['technology', 'science'],
    gradient: ['#3730A3', '#7C3AED'],
  },
  {
    id: 'govt',
    emoji: '🏛️',
    label: 'Government Employee',
    labelHi: 'सरकारी कर्मचारी',
    keywords: ['DA hike', 'pay commission', 'pension India', 'government employee news'],
    categories: ['politics', 'top'],
    gradient: ['#7F1D1D', '#B91C1C'],
  },
  {
    id: 'business',
    emoji: '₹',
    label: 'Business / Trader',
    labelHi: 'व्यापारी',
    keywords: ['GST latest news', 'MSME loan scheme', 'RBI repo rate', 'income tax India'],
    categories: ['business'],
    gradient: ['#9A3412', '#EA580C'],
  },
  {
    id: 'doctor',
    emoji: '✚',
    label: 'Doctor / Health',
    labelHi: 'डॉक्टर',
    keywords: ['NMC guidelines', 'Ayushman Bharat', 'AIIMS news', 'health policy India'],
    categories: ['health', 'science'],
    gradient: ['#155E75', '#0891B2'],
  },
  {
    id: 'teacher',
    emoji: '📚',
    label: 'Teacher',
    labelHi: 'शिक्षक',
    keywords: ['NEP 2020 news', 'CBSE NCERT news', 'UGC NET news', 'teacher recruitment'],
    categories: ['education', 'politics'],
    gradient: ['#14532D', '#16A34A'],
  },
  {
    id: 'homemaker',
    emoji: '🏠',
    label: 'Homemaker',
    labelHi: 'गृहिणी',
    keywords: ['price rise India', 'LPG cylinder price', 'ration card news', 'women welfare scheme'],
    categories: ['business', 'top'],
    gradient: ['#831843', '#DB2777'],
  },
  {
    id: 'other',
    emoji: 'जन',
    label: 'Common Citizen',
    labelHi: 'आम नागरिक',
    keywords: ['India top news today', 'breaking news India', 'India latest news'],
    categories: ['top', 'politics'],
    gradient: ['#334155', '#475569'],
  },
];

export interface Interest {
  id: string;
  emoji: string;
  label: string;
  labelHi: string;
  keywords: string[];
}

export const INTERESTS: Interest[] = [
  { id: 'politics', emoji: '🏛️', label: 'Politics', labelHi: 'राजनीति', keywords: ['India politics', 'BJP Congress AAP news'] },
  { id: 'agriculture', emoji: '🌾', label: 'Agriculture', labelHi: 'कृषि', keywords: ['kisan mandi MSP fasal'] },
  { id: 'education', emoji: '📚', label: 'Education', labelHi: 'शिक्षा', keywords: ['UPSC JEE NEET board exam'] },
  { id: 'health', emoji: '✚', label: 'Health', labelHi: 'स्वास्थ्य', keywords: ['health India hospital disease'] },
  { id: 'economy', emoji: '₹', label: 'Economy', labelHi: 'अर्थव्यवस्था', keywords: ['India economy GDP budget'] },
  { id: 'environment', emoji: '🌿', label: 'Environment', labelHi: 'पर्यावरण', keywords: ['climate India pollution flood'] },
  { id: 'technology', emoji: '⚙️', label: 'Technology', labelHi: 'तकनीक', keywords: ['India startup tech AI ISRO'] },
  { id: 'sports', emoji: '🏏', label: 'Sports', labelHi: 'खेल', keywords: ['cricket India IPL Olympics'] },
  { id: 'courts', emoji: '⚖️', label: 'Courts & Law', labelHi: 'न्यायालय', keywords: ['Supreme Court India verdict'] },
  { id: 'infrastructure', emoji: '🚆', label: 'Infrastructure', labelHi: 'बुनियादी ढांचा', keywords: ['highway railway metro India'] },
  { id: 'international', emoji: '🌐', label: 'International', labelHi: 'अंतरराष्ट्रीय', keywords: ['India foreign policy world news'] },
  { id: 'weather', emoji: '☔', label: 'Weather', labelHi: 'मौसम', keywords: ['monsoon flood drought India weather'] },
  { id: 'accountability', emoji: '✊', label: 'Accountability', labelHi: 'जवाबदेही', keywords: ['RTI corruption scam India'] },
  { id: 'women', emoji: '♀', label: 'Women & Gender', labelHi: 'महिला', keywords: ['women India safety rights scheme'] },
];

export const AGE_GROUPS: { id: AgeGroup; label: string; emoji: string }[] = [
  { id: '18-25', label: '18-25 yrs', emoji: '18+' },
  { id: '26-35', label: '26-35 yrs', emoji: '26+' },
  { id: '36-50', label: '36-50 yrs', emoji: '36+' },
  { id: '50+', label: '50+ yrs', emoji: '50+' },
];
