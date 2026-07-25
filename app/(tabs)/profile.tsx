import React from 'react';
import { Alert, Linking, ScrollView, StatusBar, StyleSheet, Switch, View, useColorScheme } from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { INTERESTS, PROFESSIONS } from '@/constants/professions';
import { spacing } from '@/constants/theme';
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
        trackColor={{ false: C.border, true: C.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { profile, resetProfile, setProfile } = useProfileStore();

  const profession = PROFESSIONS.find((item) => item.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];
  const interests = INTERESTS.filter((item) => profile.interests.includes(item.id)).slice(0, 4);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.identityCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <JanSamacharLogo />
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: C.primary }]}>
              <AppText variant="sectionTitle" tone="inverse">जन</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="sectionTitle">{profile.displayName || 'Reader profile'}</AppText>
              <AppText variant="body" tone="secondary">{profile.districtName}, {profile.stateName}</AppText>
            </View>
            <Badge label={profile.language === 'both' ? 'HI + EN' : profile.language.toUpperCase()} tone="verified" />
          </View>
          <View style={styles.badgeWrap}>
            <Badge label={profession.label} tone="primary" />
            {interests.map((interest) => <Badge key={interest.id} label={interest.label} tone="muted" />)}
          </View>
          <AppButton
            label="Edit onboarding choices"
            variant="secondary"
            onPress={() => Alert.alert('Coming soon', 'Profile editing will reuse the onboarding preference flow.')}
          />
        </View>

        <SectionHeader title="Reading preferences" eyebrow="Personalization" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <SettingRow
            title="Breaking news alerts"
            subtitle="Notify only for major verified updates"
            value={profile.breakingAlerts}
            onValueChange={(value) => setProfile({ breakingAlerts: value })}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingRow
            title="Data saver"
            subtitle="Prefer lighter images and fewer video previews"
            value={profile.dataSaver}
            onValueChange={(value) => setProfile({ dataSaver: value })}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingRow
            title="Video autoplay"
            subtitle="Sound never starts automatically"
            value={profile.videoAutoplay}
            onValueChange={(value) => setProfile({ videoAutoplay: value })}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <View style={styles.preferenceBlock}>
            <AppText variant="bodyStrong">Theme</AppText>
            <View style={styles.chipWrap}>
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <Chip
                  key={mode}
                  label={mode[0].toUpperCase() + mode.slice(1)}
                  selected={profile.themePreference === mode}
                  onPress={() => setProfile({ themePreference: mode })}
                  compact
                />
              ))}
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <View style={styles.preferenceBlock}>
            <AppText variant="bodyStrong">Notification budget</AppText>
            <AppText variant="caption" tone="muted">Maximum verified alerts per day</AppText>
            <View style={styles.chipWrap}>
              {[3, 6, 12].map((budget) => (
                <Chip
                  key={budget}
                  label={`${budget}/day`}
                  selected={profile.notificationBudgetPerDay === budget}
                  onPress={() => setProfile({ notificationBudgetPerDay: budget })}
                  compact
                />
              ))}
            </View>
          </View>
        </View>

        <SectionHeader title="Trust system" eyebrow="How JanSamachar labels news" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            ['Verified source', 'Established newsroom, official body, or vetted channel.', 'verified'],
            ['Developing story', 'Facts may change; check updated timestamps.', 'live'],
            ['AI summary', 'Generated for speed and always paired with a disclaimer.', 'ai'],
            ['Fact check', 'Claim review from a dedicated fact-check source.', 'fact'],
          ].map(([title, subtitle, tone]) => (
            <View key={title} style={styles.trustRow}>
              <Badge label={title} tone={tone as 'verified' | 'live' | 'ai' | 'fact'} />
              <AppText variant="caption" tone="muted" style={{ flex: 1 }}>{subtitle}</AppText>
            </View>
          ))}
        </View>

        <SectionHeader title="Quick actions" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <AppButton label="Saved stories" variant="secondary" onPress={() => Alert.alert('Saved stories', 'Bookmarks screen is pending backend persistence.')} />
          <AppButton label="Notification centre" variant="secondary" onPress={() => Alert.alert('Notifications', 'Expo push preferences are ready for backend wiring.')} />
          <AppButton label="File RTI" variant="secondary" onPress={() => Linking.openURL('https://rtionline.gov.in')} />
          <AppButton label="Consumer helpline" variant="secondary" onPress={() => Linking.openURL('https://consumerhelpline.gov.in')} />
        </View>

        <SectionHeader title="About" />
        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <AppText variant="body" tone="secondary">
            JanSamachar combines local updates, trusted sources, videos, civic documents, and AI summaries for a clearer Indian news experience.
          </AppText>
          <AppText variant="caption" tone="muted">Version {appVersion} • Production UI pass</AppText>
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
  identityCard: { borderRadius: 22, borderWidth: 1, padding: spacing.lg, gap: spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  panel: { borderRadius: 18, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 },
  preferenceBlock: { gap: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  divider: { height: 1 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
});
