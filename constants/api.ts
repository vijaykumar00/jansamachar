// JanSamachar API configuration
// Keep real credentials in .env.local. Commit only .env.example.

export const API_CONFIG = {
  YOUTUBE_API_KEY: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '',
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  RSS2JSON_KEY: process.env.EXPO_PUBLIC_RSS2JSON_KEY ?? '',
  AGORA_APP_ID: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '',
  NEWS_API_KEY: process.env.EXPO_PUBLIC_NEWS_API_KEY ?? '',
};

export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';
