import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StatusBar, StyleSheet, Switch, View, useColorScheme } from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { INTERESTS, PROFESSIONS } from '@/constants/professions';
import { radius, spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/userProfileStore';
import {
  AppButton,
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
  const C = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
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

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
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
            Basic browsing never requires an account. Sign in later to sync bookmarks and history.
          </AppText>
          <AppButton
            label="Sign in or create account"
            variant="secondary"
            onPress={() => Alert.alert('Optional sign-in', 'Auth is optional and can connect to Supabase when enabled.')}
          />
        </View>

        <SectionHeader title="Bookmarks" eyebrow="Saved reading" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          {['Electoral bond explainer', 'RTI citizen guide', 'Delhi AQI updates'].map((item) => (
            <Pressable key={item} accessibilityRole="button" style={styles.listRow}>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">{item}</AppText>
                <AppText variant="caption" tone="muted">Saved on this device</AppText>
              </View>
              <Badge label="Saved" tone="saved" />
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Reading History" eyebrow="Recent stories" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          {['Current affairs roundup', 'Ground report video', 'Local civic update'].map((item, index) => (
            <View key={item} style={styles.listRow}>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">{item}</AppText>
                <AppText variant="caption" tone="muted">{index + 1}h ago</AppText>
              </View>
              <Badge label="History" tone="topic" />
            </View>
          ))}
        </View>

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
            subtitle="Prefer lighter images and fewer previews."
            value={profile.dataSaver}
            onValueChange={(value) => setProfile({ dataSaver: value })}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingRow
            title="Video autoplay"
            subtitle="Sound never starts automatically."
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
          <AppButton label="File RTI" variant="secondary" onPress={() => Linking.openURL('https://rtionline.gov.in')} />
          <AppButton label="Consumer helpline" variant="secondary" onPress={() => Linking.openURL('https://consumerhelpline.gov.in')} />
        </View>

        <SectionHeader title="About" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <AppText variant="body" tone="secondary">
            JanSamachar keeps browsing open, then layers personalization, saved reading, and optional account sync when you want it.
          </AppText>
          <AppText variant="caption" tone="muted">Version {appVersion}</AppText>
          <View style={styles.actionRow}>
            <AppButton label="Privacy" variant="ghost" style={{ flex: 1 }} />
            <AppButton label="Terms" variant="ghost" style={{ flex: 1 }} />
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
  listRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
});
