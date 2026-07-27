import React from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Switch, View } from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { INTERESTS, PROFESSIONS } from '@/constants/professions';
import { radius, spacing } from '@/constants/theme';
import { useProfileStore, useResolvedColorScheme } from '@/store/userProfileStore';
import { openExternalUrl } from '@/services/linkService';
import {
  AppButton,
  AppIcon,
  AppText,
  Badge,
  Chip,
  JanSamacharLogo,
  Screen,
  SectionHeader,
} from '@/components/ui/design-system';

function SettingRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" tone="muted">{subtitle}</AppText>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: C.border, true: C.coral }}
        thumbColor={C.textInverse}
      />
    </View>
  );
}

function StatusPanel({
  icon,
  title,
  message,
  badge,
}: {
  icon: 'lock' | 'save' | 'history' | 'info';
  title: string;
  message: string;
  badge?: string;
}) {
  const C = useResolvedColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={[styles.statusPanel, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={[styles.statusIcon, { backgroundColor: C.surfaceElevated }]}>
        <AppIcon name={icon} color={C.coral} size={22} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" tone="muted">{message}</AppText>
      </View>
      {badge ? <Badge label={badge} tone="topic" /> : null}
    </View>
  );
}

export default function ProfileScreen() {
  const isDark = useResolvedColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { profile, resetProfile, setProfile } = useProfileStore();
  const profession = PROFESSIONS.find((item) => item.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const toggleInterest = (id: string) => {
    const next = profile.interests.includes(id)
      ? profile.interests.filter((item) => item !== id)
      : [...profile.interests, id];
    setProfile({ interests: next.length > 0 ? next : profile.interests });
  };

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.identityCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <JanSamacharLogo />
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: C.coral }]}>
              <AppText variant="sectionTitle" tone="inverse">JS</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="sectionTitle">{profile.displayName || 'Reader profile'}</AppText>
              <AppText variant="body" tone="secondary">{profile.districtName || 'No district'}, {profile.stateName || 'No state'}</AppText>
            </View>
            <Badge label={profile.language === 'both' ? 'HI + EN' : profile.language.toUpperCase()} tone="verified" />
          </View>
          <View style={styles.badgeWrap}>
            <Badge label={profession.label} tone="primary" />
            <Badge label={`${profile.notificationBudgetPerDay}/day max`} tone="topic" />
          </View>
        </View>

        <SectionHeader title="Sign In" eyebrow="Optional" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <AppText variant="body" tone="secondary">
            Basic browsing works without an account. Sync will be enabled after Supabase auth screens are connected.
          </AppText>
          <AppButton
            label="Sign-in setup pending"
            variant="secondary"
            icon="lock"
            onPress={() => Alert.alert('Sign-in pending', 'Supabase auth helpers exist, but the sign-in screen is not connected yet.')}
          />
        </View>

        <SectionHeader title="Bookmarks" eyebrow="Saved reading" />
        <StatusPanel
          icon="save"
          title="No synced bookmarks yet"
          message="Story save actions are marked for this session until account sync is connected."
          badge="Pending"
        />

        <SectionHeader title="Reading History" eyebrow="Recent stories" />
        <StatusPanel
          icon="history"
          title="History is not tracked yet"
          message="A local reading history can be added without changing the public browsing model."
          badge="Empty"
        />

        <SectionHeader title="Notifications" eyebrow="2-3 per day works best" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <SettingRow
            title="Breaking news alerts"
            subtitle="Keep this focused: usually 2-3 verified alerts per day."
            value={profile.breakingAlerts}
            onValueChange={(value) => setProfile({ breakingAlerts: value, notificationBudgetPerDay: value ? 3 : 0 })}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingRow
            title="Data saver"
            subtitle="Turns off story and video preview images."
            value={profile.dataSaver}
            onValueChange={(value) => setProfile({ dataSaver: value })}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingRow
            title="Video autoplay"
            subtitle="Prepared for embedded playback; current videos open on tap."
            value={profile.videoAutoplay}
            onValueChange={(value) => setProfile({ videoAutoplay: value })}
          />
          <View style={styles.chipWrap}>
            {[2, 3, 6].map((budget) => (
              <Chip
                key={budget}
                label={budget === 6 ? 'More updates' : `${budget}/day`}
                selected={profile.notificationBudgetPerDay === budget}
                onPress={() => setProfile({ notificationBudgetPerDay: budget, breakingAlerts: budget > 0 })}
                compact
              />
            ))}
          </View>
        </View>

        <SectionHeader title="Theme" eyebrow="Stored on this device" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.chipWrap}>
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <Chip
                key={mode}
                label={mode[0].toUpperCase() + mode.slice(1)}
                selected={profile.themePreference === mode}
                onPress={() => setProfile({ themePreference: mode })}
              />
            ))}
          </View>
        </View>

        <SectionHeader title="Manage Interests" eyebrow="Same picker as onboarding" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.chipWrap}>
            {INTERESTS.map((item) => (
              <Chip
                key={item.id}
                icon={item.emoji}
                label={item.label}
                selected={profile.interests.includes(item.id)}
                onPress={() => toggleInterest(item.id)}
              />
            ))}
          </View>
        </View>

        <SectionHeader title="Quick Actions" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <AppButton label="File RTI" variant="secondary" onPress={() => openExternalUrl('https://rtionline.gov.in')} />
          <AppButton label="Consumer helpline" variant="secondary" onPress={() => openExternalUrl('https://consumerhelpline.gov.in')} />
        </View>

        <SectionHeader title="About" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <AppText variant="body" tone="secondary">
            JanSamachar keeps browsing open, then layers personalization, saved reading, and optional account sync when you want it.
          </AppText>
          <AppText variant="caption" tone="muted">Version {appVersion}</AppText>
          <View style={styles.actionRow}>
            <AppButton
              label="Privacy"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() => Alert.alert('Privacy pending', 'A public privacy page is not configured yet.')}
            />
            <AppButton
              label="Terms"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() => Alert.alert('Terms pending', 'A public terms page is not configured yet.')}
            />
          </View>
          <AppButton
            label="Reset onboarding"
            variant="danger"
            onPress={() => {
              resetProfile();
              Alert.alert('Preferences reset', 'Restart the app to see onboarding again.');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 112 },
  identityCard: { borderRadius: radius.card, borderWidth: 1, padding: spacing.lg, gap: spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  panel: { borderRadius: radius.card, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  divider: { height: 1 },
  statusPanel: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
});
