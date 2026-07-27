import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const sourceDirs = ['app', 'components', 'constants', 'services', 'store'];

function sourceFiles(dir) {
  const absoluteDir = join(root, dir);
  return readdirSync(absoluteDir).flatMap((name) => {
    const fullPath = join(absoluteDir, name);
    const relativePath = `${dir}/${name}`.replaceAll('\\', '/');
    if (statSync(fullPath).isDirectory()) return sourceFiles(relativePath);
    return /\.(ts|tsx)$/.test(name) ? [relativePath] : [];
  });
}

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

test('Phase 2 uses semantic icons instead of letter action controls', () => {
  const designSystem = read('components/ui/design-system.tsx');
  assert.match(designSystem, /export function AppIcon/);
  assert.match(designSystem, /SymbolView/);

  const checkedFiles = [
    'app/(tabs)/_layout.tsx',
    'app/(tabs)/index.tsx',
    'app/modal.tsx',
    'components/AnimatedNewsCard.tsx',
    'app/(tabs)/live.tsx',
  ];
  for (const file of checkedFiles) {
    assert.doesNotMatch(read(file), /icon="(?:H|Q|L|V|P|X|S|!|>)"/, `${file} should use semantic icon names`);
  }
});

test('fallback and profile placeholder copy is honest', () => {
  const appSource = sourceDirs.flatMap(sourceFiles).map(read).join('\n');
  assert.doesNotMatch(appSource, /Showing saved stories/);
  assert.doesNotMatch(appSource, /Backend bookmark persistence/);
  assert.doesNotMatch(appSource, /Auth is optional and can connect/);
  assert.match(read('app/(tabs)/profile.tsx'), /No saved stories yet/);
  assert.match(read('app/(tabs)/profile.tsx'), /No reading history yet/);
});

test('theme and data saver preferences are wired into UI surfaces', () => {
  assert.match(read('store/userProfileStore.ts'), /useResolvedColorScheme/);
  assert.match(read('components/ui/design-system.tsx'), /useResolvedColorScheme/);
  assert.match(read('components/AnimatedNewsCard.tsx'), /profile\.dataSaver|dataSaver/);
  assert.match(read('app/modal.tsx'), /profile\.dataSaver/);
  assert.match(read('app/(tabs)/live.tsx'), /PREVIEW OFF/);
});

test('source files do not contain common mojibake byte-range artifacts', () => {
  for (const file of sourceDirs.flatMap(sourceFiles)) {
    assert.doesNotMatch(read(file), /[\u00c0-\u00ff]{2,}/, `${file} appears to contain mojibake`);
  }
});

test('Phase 3 persists local saved articles and reading history', () => {
  const store = read('store/engagementStore.ts');
  assert.match(store, /jansamachar_engagement_v1/);
  assert.match(store, /saveStory/);
  assert.match(store, /toggleSavedStory/);
  assert.match(store, /addHistory/);
  assert.match(store, /MAX_SAVED_ITEMS = 80/);
  assert.match(store, /MAX_HISTORY_ITEMS = 80/);
});

test('story open and save actions are wired into engagement store', () => {
  assert.match(read('components/AnimatedNewsCard.tsx'), /toggleSavedStory/);
  assert.match(read('components/AnimatedNewsCard.tsx'), /addHistory/);
  assert.match(read('app/modal.tsx'), /toggleSavedStory/);
  assert.match(read('app/modal.tsx'), /addHistory/);
});

test('Profile and Home expose local engagement value', () => {
  const profile = read('app/(tabs)/profile.tsx');
  const home = read('app/(tabs)/index.tsx');
  assert.match(profile, /savedItems/);
  assert.match(profile, /historyItems/);
  assert.match(profile, /removeSavedStory/);
  assert.match(profile, /clearHistory/);
  assert.match(home, /Continue Reading/);
  assert.match(home, /Saved For Later/);
  assert.match(home, /ReturnUserStrip/);
});

test('Phase 4 analytics are local and privacy-safe', () => {
  const analytics = read('services/analyticsService.ts');
  assert.match(analytics, /jansamachar_local_analytics_v1/);
  assert.match(analytics, /MAX_EVENTS = 150/);
  assert.match(analytics, /sanitizeProperties/);
  assert.doesNotMatch(analytics, /https?:\/\//);
  assert.match(read('app/_layout.tsx'), /app_opened/);
  assert.match(read('app/(tabs)/search.tsx'), /search_performed/);
  assert.match(read('store/engagementStore.ts'), /story_saved/);
  assert.match(read('store/engagementStore.ts'), /story_viewed/);
});

test('third-party fetches use timeout/retry helper', () => {
  assert.match(read('services/fetchService.ts'), /fetchWithTimeout/);
  const serviceFiles = [
    'services/newsDataService.ts',
    'services/youtubeSearchService.ts',
    'services/geminiService.ts',
    'services/newsService.ts',
    'services/geoService.ts',
    'services/proxyClient.ts',
  ];
  for (const file of serviceFiles) {
    assert.match(read(file), /fetchWithTimeout/, `${file} should use fetchWithTimeout`);
  }
});

test('provider fallback metadata is centralized', () => {
  assert.match(read('services/fallbackService.ts'), /FallbackReason/);
  assert.match(read('services/fallbackService.ts'), /fallbackLabel/);
  assert.match(read('app/(tabs)/index.tsx'), /fallbackLabel\(createFallbackMeta/);
  assert.match(read('app/(tabs)/documents.tsx'), /fallbackLabel\(createFallbackMeta/);
  assert.match(read('app/(tabs)/live.tsx'), /fallbackLabel\(createFallbackMeta/);
  assert.match(read('app/(tabs)/search.tsx'), /fallbackLabel\(createFallbackMeta/);
});

test('low-risk provider dedupe caches and sync contracts exist', () => {
  assert.match(read('services/newsDataService.ts'), /responseCache/);
  assert.match(read('services/youtubeSearchService.ts'), /responseCache/);
  assert.match(read('services/syncContracts.ts'), /EngagementSyncRecord/);
  assert.match(read('services/syncContracts.ts'), /buildEngagementSyncSnapshot/);
});

test('runtime news surfaces do not use mock data or demo mode', () => {
  const appSource = sourceDirs.flatMap(sourceFiles).map(read).join('\n');
  assert.ok(!existsSync(join(root, 'services/mockData.ts')), 'mockData service should not exist in runtime source');
  assert.doesNotMatch(appSource, /MOCK_[A-Z0-9_]+/);
  assert.doesNotMatch(appSource, /from ['"].*mockData['"]/);
  assert.doesNotMatch(appSource, /DEMO_MODE/);
  assert.doesNotMatch(read('.env.example'), /EXPO_PUBLIC_DEMO_MODE/);
});
