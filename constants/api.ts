// JanSamachar API configuration
// Keep real values in .env.local. Only EXPO_PUBLIC_* variables are exposed to the app.

export const API_CONFIG = {
  // YouTube Data API v3
  YOUTUBE_API_KEY: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '',

  // Google Gemini API
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',

  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  // RSS2JSON proxy
  RSS2JSON_KEY: process.env.EXPO_PUBLIC_RSS2JSON_KEY ?? '',

  // Agora.io
  AGORA_APP_ID: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '',

  // NewsAPI
  NEWS_API_KEY: process.env.EXPO_PUBLIC_NEWS_API_KEY ?? '',
};

export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';
