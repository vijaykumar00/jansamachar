// JanSamachar — User Professions & Interest Categories

export type ProfessionId = 'farmer' | 'student' | 'engineer' | 'govt' | 'business' | 'doctor' | 'teacher' | 'homemaker' | 'other';
export type AgeGroup = '18-25' | '26-35' | '36-50' | '50+';
export type Language = 'hi' | 'en' | 'both';

export interface Profession {
  id: ProfessionId;
  emoji: string;
  label: string;
  labelHi: string;
  keywords: string[];
  categories: string[];   // NewsData.io category filters
  gradient: string[];     // Card gradient colors
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'farmer',
    emoji: '👨‍🌾',
    label: 'Kisan / Farmer',
    labelHi: 'किसान',
    keywords: ['MSP mandi kisan', 'fasal bima', 'PMKISAN', 'krishi news', 'kisan andolan', 'weather agriculture India', 'crop price mandi'],
    categories: 'environment,business',
    gradient: ['#134E0F', '#1a6e14'],
  },
  {
    id: 'student',
    emoji: '👨‍🎓',
    label: 'Student',
    labelHi: 'छात्र',
    keywords: ['UPSC result 2025', 'JEE NEET news', 'board exam result', 'sarkari naukri', 'scholarship India', 'university news India'],
    categories: 'education',
    gradient: ['#1a237e', '#283593'],
  },
  {
    id: 'engineer',
    emoji: '👷',
    label: 'Engineer / Tech',
    labelHi: 'इंजीनियर',
    keywords: ['India startup news', 'technology India 2025', 'ISRO news', 'IT sector India', 'semiconductor India', 'AI India policy'],
    categories: 'technology,science',
    gradient: ['#4a148c', '#6a1b9a'],
  },
  {
    id: 'govt',
    emoji: '🏛️',
    label: 'Govt Employee',
    labelHi: 'सरकारी कर्मचारी',
    keywords: ['DA hike 2025', '7th pay commission', 'OPS NPS news', 'sarkari naukri transfer', 'gratuity pension India', 'government employee news'],
    categories: 'politics,top',
    gradient: ['#b71c1c', '#c62828'],
  },
  {
    id: 'business',
    emoji: '🏪',
    label: 'Business / Trader',
    labelHi: 'व्यापारी',
    keywords: ['GST latest news', 'MSME loan scheme', 'RBI repo rate', 'income tax India', 'stock market India', 'import export policy'],
    categories: 'business',
    gradient: ['#e65100', '#ef6c00'],
  },
  {
    id: 'doctor',
    emoji: '🏥',
    label: 'Doctor / Health',
    labelHi: 'डॉक्टर',
    keywords: ['NEET PG news', 'NMC guidelines', 'Ayushman Bharat', 'AIIMS news', 'IMA India', 'health policy India 2025'],
    categories: 'health,science',
    gradient: ['#006064', '#00838f'],
  },
  {
    id: 'teacher',
    emoji: '📚',
    label: 'Teacher / Professor',
    labelHi: 'शिक्षक',
    keywords: ['NEP 2020 news', 'CBSE NCERT news', 'UGC NET news', 'school education India', 'teacher recruitment', 'higher education policy'],
    categories: 'education,politics',
    gradient: ['#1b5e20', '#2e7d32'],
  },
  {
    id: 'homemaker',
    emoji: '🏠',
    label: 'Homemaker',
    labelHi: 'गृहिणी',
    keywords: ['price rise India', 'LPG cylinder price', 'ration card news', 'women welfare scheme', 'consumer news India', 'inflation India'],
    categories: 'business,top',
    gradient: ['#880e4f', '#ad1457'],
  },
  {
    id: 'other',
    emoji: '🙋',
    label: 'Common Citizen',
    labelHi: 'आम नागरिक',
    keywords: ['India top news today', 'breaking news India', 'India latest news'],
    categories: 'top,politics',
    gradient: ['#37474f', '#455a64'],
  },
] as any[];

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
  { id: 'health', emoji: '💊', label: 'Health', labelHi: 'स्वास्थ्य', keywords: ['health India hospital disease'] },
  { id: 'economy', emoji: '💰', label: 'Economy', labelHi: 'अर्थव्यवस्था', keywords: ['India economy GDP budget'] },
  { id: 'environment', emoji: '🌿', label: 'Environment', labelHi: 'पर्यावरण', keywords: ['climate India pollution flood'] },
  { id: 'technology', emoji: '💻', label: 'Technology', labelHi: 'तकनीक', keywords: ['India startup tech AI ISRO'] },
  { id: 'sports', emoji: '⚽', label: 'Sports', labelHi: 'खेल', keywords: ['cricket India IPL Olympics'] },
  { id: 'courts', emoji: '⚖️', label: 'Courts & Law', labelHi: 'न्यायालय', keywords: ['Supreme Court India verdict'] },
  { id: 'infrastructure', emoji: '🚂', label: 'Infrastructure', labelHi: 'बुनियादी ढांचा', keywords: ['highway railway metro India'] },
  { id: 'international', emoji: '🌍', label: 'International', labelHi: 'अंतर्राष्ट्रीय', keywords: ['India foreign policy world news'] },
  { id: 'weather', emoji: '🌦️', label: 'Weather', labelHi: 'मौसम', keywords: ['monsoon flood drought India weather'] },
  { id: 'accountability', emoji: '✊', label: 'Accountability', labelHi: 'जवाबदेही', keywords: ['RTI corruption scam India'] },
  { id: 'women', emoji: '👩', label: 'Women & Gender', labelHi: 'महिला', keywords: ['women India safety rights scheme'] },
];

export const AGE_GROUPS: { id: AgeGroup; label: string; emoji: string }[] = [
  { id: '18-25', label: '18–25 yrs', emoji: '🧑' },
  { id: '26-35', label: '26–35 yrs', emoji: '👨' },
  { id: '36-50', label: '36–50 yrs', emoji: '🧔' },
  { id: '50+', label: '50+ yrs', emoji: '👴' },
];
