import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

test('Expo notification icon points to an existing asset', () => {
  const appJson = JSON.parse(read('app.json'));
  const notificationPlugin = appJson.expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications');
  assert.ok(notificationPlugin, 'expo-notifications plugin should be configured');

  const iconPath = notificationPlugin[1]?.icon;
  assert.ok(iconPath, 'notification icon should be set');
  assert.ok(existsSync(join(root, iconPath)), `${iconPath} should exist`);
});

test('package scripts expose Phase 1 verification commands', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit');
  assert.equal(pkg.scripts.lint, 'node --test tests/static-lint.test.mjs');
  assert.equal(pkg.scripts.test, 'node --test tests/static-lint.test.mjs');
});

test('external links are opened only through the guarded link service', () => {
  const files = [
    'components/AnimatedNewsCard.tsx',
    'app/modal.tsx',
    'app/(tabs)/documents.tsx',
    'app/(tabs)/live.tsx',
    'app/(tabs)/profile.tsx',
    'app/(tabs)/search.tsx',
  ];

  for (const file of files) {
    assert.ok(!read(file).includes('Linking.openURL'), `${file} should use openExternalUrl`);
  }
});

test('link guard blocks unsafe schemes and local hosts', () => {
  const source = read('services/linkService.ts');
  assert.match(source, /new Set\(\['http:', 'https:', 'whatsapp:'\]\)/);
  assert.doesNotMatch(source, /'javascript:'|"javascript:"/);
  assert.match(source, /localhost/);
  assert.match(source, /127\.0\.0\.1/);
});

test('Supabase schema has duplicate-resistant votes and feed indexes', () => {
  const sql = read('supabase_setup.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS post_votes/);
  assert.match(sql, /PRIMARY KEY \(post_id, user_id\)/);
  assert.match(sql, /ON CONFLICT DO NOTHING/);
  assert.match(sql, /auth\.uid\(\) IS NULL/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_news_posts_category_created_at/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_saved_news_user_saved_at/);
});

test('backend proxy migration is opt-in and available to protected services', () => {
  assert.match(read('.env.example'), /EXPO_PUBLIC_BACKEND_PROXY_URL=/);
  assert.match(read('constants/api.ts'), /BACKEND_PROXY_URL/);
  assert.match(read('services/newsDataService.ts'), /hasBackendProxy\(\)/);
  assert.match(read('services/youtubeSearchService.ts'), /hasBackendProxy\(\)/);
  assert.match(read('services/geminiService.ts'), /postProxyJson/);
});
