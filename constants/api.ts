// JanSamachar — API Configuration
// ✅ All values come from .env.local (never hardcoded here)
// ✅ Expo reads EXPO_PUBLIC_* variables automatically at build time
// ⚠️ Never hardcode real keys in this file — use .env.local

export const API_CONFIG = {
  // YouTube Data API v3 — fetches news videos (search + channels)
  YOUTUBE_API_KEY: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '',

  // Google Gemini API — AI news summaries, translation, fact-check
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',

  // NewsData.io — India district/state news, Hindi+English (200 req/day free)
  NEWSDATA_API_KEY: process.env.EXPO_PUBLIC_NEWSDATA_API_KEY ?? '',
  NEWS_API_KEY: process.env.EXPO_PUBLIC_NEWS_API_KEY ?? '',
  RSS2JSON_KEY: process.env.EXPO_PUBLIC_RSS2JSON_KEY ?? '',

  // Supabase — user auth, database, realtime
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  // Optional backend proxy for quota-protected third-party APIs.
  BACKEND_PROXY_URL: process.env.EXPO_PUBLIC_BACKEND_PROXY_URL ?? '',

  // CountryStateCity.in — India state→district→city hierarchy (free tier)
  // Sign up free at: countrystatecity.in
  CSC_API_KEY: process.env.EXPO_PUBLIC_CSC_API_KEY ?? '',

  // Agora.io — live streaming (10,000 free min/month)
  AGORA_APP_ID: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '',
};

// App mode — set EXPO_PUBLIC_DEMO_MODE=true in .env.local for offline testing
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
