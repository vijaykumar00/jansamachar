-- JanSamachar — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- ─── Enable UUID extension ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── User Profiles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Citizen Reporter',
  avatar_url TEXT,
  bio TEXT,
  trust_level TEXT NOT NULL DEFAULT 'citizen' CHECK (trust_level IN ('citizen', 'verified', 'journalist')),
  posts_count INTEGER DEFAULT 0,
  state TEXT,
  language TEXT DEFAULT 'hi',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Citizen Reporter'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── News Posts (Citizen Journalism) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS news_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  doc_url TEXT,
  video_url TEXT,
  category TEXT DEFAULT 'politics',
  location TEXT,
  state TEXT,
  language TEXT DEFAULT 'hi' CHECK (language IN ('hi', 'en')),
  trust_level TEXT DEFAULT 'citizen',
  upvotes INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to increment upvotes
CREATE OR REPLACE FUNCTION increment_upvotes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE news_posts SET upvotes = upvotes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Live Streams ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  doc_url TEXT,
  agora_channel TEXT NOT NULL,
  category TEXT DEFAULT 'politics',
  is_live BOOLEAN DEFAULT TRUE,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- ─── Saved News ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  news_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  url TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, news_id)
);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_news ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- News posts: anyone can read, only logged-in users can insert
CREATE POLICY "News posts are viewable by everyone" ON news_posts FOR SELECT USING (true);
CREATE POLICY "Logged-in users can create posts" ON news_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON news_posts FOR UPDATE USING (auth.uid() = user_id);

-- Live streams: anyone can read, only owner can manage
CREATE POLICY "Live streams viewable by everyone" ON live_streams FOR SELECT USING (true);
CREATE POLICY "Logged-in users can create streams" ON live_streams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streams" ON live_streams FOR UPDATE USING (auth.uid() = user_id);

-- Saved news: only owner can see/manage
CREATE POLICY "Users can view own saved news" ON saved_news FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save news" ON saved_news FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved news" ON saved_news FOR DELETE USING (auth.uid() = user_id);

-- ─── Enable Realtime ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE news_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE live_streams;
