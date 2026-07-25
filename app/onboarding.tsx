import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, TextInput, View, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { INTERESTS, PROFESSIONS, type Language, type ProfessionId } from '@/constants/professions';
import { spacing } from '@/constants/theme';
import { getDistrictsForState, getIndiaGeoData, type GeoDistrict, type GeoState } from '@/services/geoService';
import { useProfileStore } from '@/store/userProfileStore';
import {
  AppButton,
  AppText,
  Chip,
  JanSamacharLogo,
  Screen,
  SectionHeader,
} from '@/components/ui/design-system';

const STEPS = ['Welcome', 'Profession', 'Location', 'Interests', 'Language'];

function Progress({ step }: { step: number }) {
  const C = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
      <View style={[styles.progressFill, { backgroundColor: C.primary, width: `${((step + 1) / STEPS.length) * 100}%` }]} />
    </View>
  );
}

export default function OnboardingScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { profile, setProfile } = useProfileStore();
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState<ProfessionId>(profile.profession);
  const [stateId, setStateId] = useState(profile.stateId);
  const [stateName, setStateName] = useState(profile.stateName);
  const [districtId, setDistrictId] = useState(profile.districtId);
  const [districtName, setDistrictName] = useState(profile.districtName);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [language, setLanguage] = useState<Language>(profile.language);
  const [states, setStates] = useState<GeoState[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  useEffect(() => {
    setGeoLoading(true);
    getIndiaGeoData()
      .then(setStates)
      .finally(() => setGeoLoading(false));
  }, []);

  useEffect(() => {
    if (!stateId) return;
    setGeoLoading(true);
    getDistrictsForState(stateId)
      .then(setDistricts)
      .finally(() => setGeoLoading(false));
  }, [stateId]);

  const filteredStates = useMemo(() => {
    const needle = stateSearch.trim().toLowerCase();
    if (!needle) return states;
    return states.filter((item) => item.name.toLowerCase().includes(needle));
  }, [stateSearch, states]);

  const canContinue = step !== 2 || Boolean(stateId && districtId);

  const finish = () => {
    setProfile({
      onboardingDone: true,
      profession,
      stateId,
      stateName,
      districtId,
      districtName,
      interests,
      language,
    });
    router.replace('/(tabs)');
  };

  const next = () => {
    if (step === STEPS.length - 1) finish();
    else setStep((value) => value + 1);
  };

  const toggleInterest = (id: string) => {
    setInterests((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <Screen>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.background} />
      <Progress step={step} />
      <View style={styles.topBar}>
        <AppText variant="caption" tone="muted">Step {step + 1} of {STEPS.length}</AppText>
        <AppButton label="Skip" variant="ghost" onPress={finish} style={styles.skipButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <View style={[styles.hero, { backgroundColor: C.secondary }]}>
            <JanSamacharLogo wordmark={false} />
            <AppText variant="screenTitle" tone="inverse">JanSamachar</AppText>
            <AppText variant="display" tone="inverse">खबरें जो आपके लिए मायने रखती हैं</AppText>
            <AppText variant="body" tone="inverse" style={{ opacity: 0.78 }}>
              JanSamachar personalizes trusted Indian news by location, language, profession, and interests.
            </AppText>
            <View style={styles.heroBullets}>
              {['Verified sources', 'Local-first updates', 'AI summaries with disclaimers'].map((item) => (
                <View key={item} style={[styles.heroBullet, { backgroundColor: C.primary }]}>
                  <AppText variant="badge" tone="inverse">{item}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <>
            <SectionHeader title="Choose your profile" eyebrow="We use this to tune recommendations" />
            <View style={styles.grid}>
              {PROFESSIONS.map((item) => (
                <Chip
                  key={item.id}
                  label={`${item.emoji} ${item.label}`}
                  selected={profession === item.id}
                  onPress={() => setProfession(item.id)}
                  style={styles.wideChip}
                />
              ))}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <SectionHeader title="Set your location" eyebrow="Manual selection keeps permissions optional" />
            <View style={[styles.inputShell, { backgroundColor: C.surface, borderColor: C.border }]}>
              <TextInput
                value={stateSearch}
                onChangeText={setStateSearch}
                placeholder="Search state..."
                placeholderTextColor={C.textMuted}
                style={[styles.input, { color: C.text }]}
              />
            </View>
            {geoLoading && states.length === 0 ? <ActivityIndicator color={C.primary} /> : null}
            <View style={styles.grid}>
              {filteredStates.slice(0, 24).map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  selected={stateId === item.id}
                  onPress={() => {
                    setStateId(item.id);
                    setStateName(item.name);
                    setDistrictId('');
                    setDistrictName('');
                  }}
                />
              ))}
            </View>
            {stateId ? (
              <>
                <SectionHeader title="District" />
                <View style={styles.grid}>
                  {districts.slice(0, 40).map((item) => (
                    <Chip
                      key={item.id}
                      label={item.name}
                      selected={districtId === item.id}
                      onPress={() => {
                        setDistrictId(item.id);
                        setDistrictName(item.name);
                      }}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <SectionHeader title="Pick interests" eyebrow="Choose at least one; three or more works best" />
            <View style={styles.grid}>
              {INTERESTS.map((item) => (
                <Chip
                  key={item.id}
                  icon={item.emoji}
                  label={item.label}
                  selected={interests.includes(item.id)}
                  onPress={() => toggleInterest(item.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <SectionHeader title="Preferred language" eyebrow="You can change this later" />
            <View style={styles.languageStack}>
              {[
                { id: 'hi' as Language, title: 'Hindi', subtitle: 'सभी खबरें हिंदी में' },
                { id: 'en' as Language, title: 'English', subtitle: 'All news in English' },
                { id: 'both' as Language, title: 'Hindi + English', subtitle: 'Bilingual feed and AI summaries' },
              ].map((item) => (
                <Chip
                  key={item.id}
                  label={`${item.title} • ${item.subtitle}`}
                  selected={language === item.id}
                  onPress={() => setLanguage(item.id)}
                  style={styles.languageChip}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.navBar, { borderTopColor: C.border, backgroundColor: C.background }]}>
        <AppButton
          label={step === 0 ? 'Not now' : 'Back'}
          variant="secondary"
          onPress={() => step === 0 ? finish() : setStep((value) => value - 1)}
          style={{ flex: 1 }}
        />
        <AppButton
          label={step === STEPS.length - 1 ? 'Start reading' : 'Continue'}
          onPress={next}
          disabled={!canContinue}
          style={[{ flex: 2 }, !canContinue && { opacity: 0.45 }]}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 4 },
  progressFill: { height: 4, borderRadius: 999 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  skipButton: { minHeight: 36, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  content: { padding: spacing.lg, paddingBottom: 24 },
  hero: { borderRadius: 24, padding: spacing.xl, gap: spacing.lg },
  heroBullets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  heroBullet: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  wideChip: { minWidth: '45%' },
  inputShell: { borderWidth: 1, borderRadius: 14, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  input: { minHeight: 48, fontSize: 15 },
  languageStack: { gap: spacing.sm },
  languageChip: { alignSelf: 'stretch', justifyContent: 'center' },
  navBar: { borderTopWidth: 1, padding: spacing.lg, flexDirection: 'row', gap: spacing.md },
});
