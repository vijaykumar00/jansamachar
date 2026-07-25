// JanSamachar — Supabase Client
// Handles: Auth (Google, Phone OTP, Facebook), User Profiles, News Posts, Live Streams

import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../constants/api';

// ─── Client ────────────────────────────────────────────────────────────────
export const supabase = createClient(
  API_CONFIG.SUPABASE_URL,
  API_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────

/** Sign in with Google OAuth */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'jansamachar://auth/callback',
    },
  });
  if (error) throw error;
  return data;
}

/** Sign in with Phone OTP (India) */
export async function sendPhoneOTP(phone: string) {
  // Phone format: +91XXXXXXXXXX
  const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
  const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
  if (error) throw error;
}

/** Verify Phone OTP */
export async function verifyPhoneOTP(phone: string, token: string) {
  const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formatted,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return data;
}

/** Sign out */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Get current user */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Get current session */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── User Profile ───────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  trust_level: 'citizen' | 'verified' | 'journalist';
  posts_count: number;
  verified_at?: string;
  created_at: string;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.warn('getProfile error:', error.message);
    return null;
  }
  return data;
}

export async function upsertProfile(profile: Partial<UserProfile> & { id: string }) {
  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' });
  if (error) throw error;
}

// ─── News Posts (Citizen Journalism) ───────────────────────────────────────

export interface NewsPost {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  image_url?: string;
  doc_url?: string;
  video_url?: string;
  category: string;
  location?: string;
  state?: string;
  language: 'hi' | 'en';
  trust_level: string;
  upvotes?: number;
  created_at?: string;
}

export async function createNewsPost(post: NewsPost) {
  const { data, error } = await supabase
    .from('news_posts')
    .insert(post)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCitizenNews(limit = 20, category?: string) {
  let query = supabase
    .from('news_posts')
    .select(`
      *,
      profiles (display_name, trust_level, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('getCitizenNews error:', error.message);
    return [];
  }
  return data || [];
}

export async function upvotePost(postId: string) {
  const { error } = await supabase.rpc('increment_upvotes', { post_id: postId });
  if (error) throw error;
}

// ─── Live Streams ────────────────────────────────────────────────────────────

export interface LiveStream {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  doc_url?: string;
  agora_channel: string;
  category: string;
  is_live: boolean;
  viewer_count?: number;
  started_at?: string;
  ended_at?: string;
}

export async function createLiveStream(stream: LiveStream) {
  const { data, error } = await supabase
    .from('live_streams')
    .insert(stream)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getActiveLiveStreams() {
  const { data, error } = await supabase
    .from('live_streams')
    .select(`*, profiles (display_name, trust_level)`)
    .eq('is_live', true)
    .order('viewer_count', { ascending: false });
  if (error) {
    console.warn('getActiveLiveStreams error:', error.message);
    return [];
  }
  return data || [];
}

export async function endLiveStream(streamId: string) {
  const { error } = await supabase
    .from('live_streams')
    .update({ is_live: false, ended_at: new Date().toISOString() })
    .eq('id', streamId);
  if (error) throw error;
}

// ─── Realtime Subscriptions ─────────────────────────────────────────────────

/** Subscribe to new citizen news posts in real-time */
export function subscribeToNewPosts(callback: (post: NewsPost) => void) {
  return supabase
    .channel('news_posts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_posts' }, (payload) => {
      callback(payload.new as NewsPost);
    })
    .subscribe();
}

/** Subscribe to live stream viewer count changes */
export function subscribeToStreamViewers(streamId: string, callback: (count: number) => void) {
  return supabase
    .channel(`stream_${streamId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'live_streams',
      filter: `id=eq.${streamId}`,
    }, (payload) => {
      callback((payload.new as LiveStream).viewer_count || 0);
    })
    .subscribe();
}
