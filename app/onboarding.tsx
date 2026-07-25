// JanSamachar — Onboarding Wizard (v2 with live geo data)
// Step 1: Profession | Step 2: Location (live API) | Step 3: Interests | Step 4: Language

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, StatusBar, SafeAreaView, Animated, TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../store/userProfileStore';
import { PROFESSIONS, INTERESTS, type ProfessionId, type Language } from '../constants/professions';
import { getIndiaGeoData, getDistrictsForState, type GeoState, type GeoDistrict } from '../services/geoService';

const { width } = Dimensions.get('window');

// ─── Step 1: Profession ──────────────────────────────────────────────────────
function StepProfession({ selected, onSelect }: { selected: ProfessionId; onSelect: (p: ProfessionId) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>आप कौन हैं?</Text>
      <Text style={styles.stepSubtitle}>Who are you? We'll personalize your news.</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.profGrid}>
        {PROFESSIONS.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.profCard,
              selected === p.id && styles.profCardSelected,
            ]}
            onPress={() => onSelect(p.id as ProfessionId)}
            activeOpacity={0.8}
          >
            <Text style={styles.profEmoji}>{p.emoji}</Text>
            <Text style={styles.profLabelHi}>{p.labelHi}</Text>
            <Text style={styles.profLabel}>{p.label}</Text>
            {selected === p.id && <View style={styles.profCheck}><Text style={{ fontSize: 10 }}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Step 2: Location (Live from CDN API) ────────────────────────────────────
function StepLocation({
  stateId, districtId,
  onSelectState, onSelectDistrict,
}: {
  stateId: string; districtId: string;
  onSelectState: (id: string, name: string) => void;
  onSelectDistrict: (id: string, name: string) => void;
}) {
  const [states, setStates] = useState<GeoState[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  // Load all states on mount (from cache or CDN)
  useEffect(() => {
    getIndiaGeoData().then(data => {
      setStates(data);
      setLoadingStates(false);
    });
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (!stateId) { setDistricts([]); return; }
    setLoadingDistricts(true);
    getDistrictsForState(stateId).then(d => {
      setDistricts(d);
      setLoadingDistricts(false);
    });
  }, [stateId]);

  const filteredStates = stateSearch
    ? states.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()))
    : states;

  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>आप कहाँ हैं?</Text>
      <Text style={styles.stepSubtitle}>Select your state and district for hyperlocal news</Text>

      {/* State Search */}
      <Text style={styles.locationLabel}>🗺️ State / राज्य</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search state..."
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={stateSearch}
        onChangeText={setStateSearch}
      />

      {loadingStates ? (
        <View style={styles.geoLoading}>
          <ActivityIndicator color="#FF9933" />
          <Text style={styles.geoLoadingText}>Loading states from Census data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.stateList} showsVerticalScrollIndicator={false}>
          <View style={styles.stateGrid}>
            {filteredStates.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.stateChip,
                  stateId === s.id && styles.stateChipSelected,
                ]}
                onPress={() => { onSelectState(s.id, s.name); onSelectDistrict('', ''); }}
              >
                <Text style={[styles.stateChipText, stateId === s.id && { color: '#fff', fontWeight: '700' }]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Districts */}
      {stateId !== '' && (
        <>
          <Text style={[styles.locationLabel, { marginTop: 16 }]}>🏘️ District / जिला</Text>
          {loadingDistricts ? (
            <View style={styles.geoLoading}>
              <ActivityIndicator color="#FF9933" size="small" />
              <Text style={styles.geoLoadingText}>Loading all districts...</Text>
            </View>
          ) : (
            <ScrollView style={styles.districtList} showsVerticalScrollIndicator={false}>
              <View style={styles.districtGrid}>
                {districts.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.districtChip,
                      districtId === d.id && styles.districtChipSelected,
                    ]}
                    onPress={() => onSelectDistrict(d.id, d.name)}
                  >
                    <Text style={[styles.districtChipText, districtId === d.id && { color: '#fff' }]}>
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

// ─── Step 3: Interests ───────────────────────────────────────────────────────
function StepInterests({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>क्या पसंद है?</Text>
      <Text style={styles.stepSubtitle}>Pick topics you care about</Text>
      <Text style={styles.interestHint}>✅ Select 3 or more for best results</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.interestGrid}>
        {INTERESTS.map(interest => {
          const isSel = selected.includes(interest.id);
          return (
            <TouchableOpacity
              key={interest.id}
              style={[styles.interestChip, isSel && styles.interestChipSelected]}
              onPress={() => onToggle(interest.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.interestEmoji}>{interest.emoji}</Text>
              <View>
                <Text style={[styles.interestLabel, isSel && { color: '#FF9933' }]}>{interest.labelHi}</Text>
                <Text style={styles.interestLabelEn}>{interest.label}</Text>
              </View>
              {isSel && <Text style={styles.interestCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Step 4: Language ────────────────────────────────────────────────────────
function StepLanguage({ selected, onSelect }: { selected: Language; onSelect: (l: Language) => void }) {
  const options: { id: Language; flag: string; label: string; sub: string }[] = [
    { id: 'hi', flag: '🇮🇳', label: 'हिंदी', sub: 'सभी खबरें हिंदी में' },
    { id: 'en', flag: '🇬🇧', label: 'English', sub: 'All news in English' },
    { id: 'both', flag: '🌐', label: 'Hindi + English', sub: 'दोनों भाषाओं में खबरें' },
  ];
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>भाषा चुनें</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred language</Text>
      <View style={styles.langOptions}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.langCard, selected === opt.id && styles.langCardSelected]}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.langFlag}>{opt.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.langLabel}>{opt.label}</Text>
              <Text style={styles.langSub}>{opt.sub}</Text>
            </View>
            {selected === opt.id && <Text style={{ fontSize: 20 }}>✅</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Main Onboarding Screen ──────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { profile, setProfile } = useProfileStore();
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState<ProfessionId>(profile.profession);
  const [stateId, setStateId] = useState(profile.stateId);
  const [stateName, setStateName] = useState(profile.stateName);
  const [districtId, setDistrictId] = useState(profile.districtId);
  const [districtName, setDistrictName] = useState(profile.districtName);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [language, setLanguage] = useState<Language>(profile.language);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const TOTAL_STEPS = 4;
  const STEP_LABELS = ['Who are you?', 'Where are you?', 'Interests', 'Language'];

  const animateTransition = (toStep: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(toStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const canProceed = () => {
    if (step === 1 && (!stateId || !districtId)) return false;
    if (step === 2 && interests.length < 1) return false;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    } else {
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
    }
  };

  const toggleInterest = (id: string) =>
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060B18" />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {/* Step info */}
      <View style={styles.stepInfo}>
        <Text style={styles.stepCount}>Step {step + 1} of {TOTAL_STEPS}</Text>
        <Text style={styles.appBrand}>🇮🇳 JanSamachar</Text>
      </View>

      {/* Animated Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === 0 && <StepProfession selected={profession} onSelect={setProfession} />}
        {step === 1 && (
          <StepLocation
            stateId={stateId}
            districtId={districtId}
            onSelectState={(id, name) => { setStateId(id); setStateName(name); }}
            onSelectDistrict={(id, name) => { setDistrictId(id); setDistrictName(name); }}
          />
        )}
        {step === 2 && <StepInterests selected={interests} onToggle={toggleInterest} />}
        {step === 3 && <StepLanguage selected={language} onSelect={setLanguage} />}
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step > 0) animateTransition(step - 1);
            else { setProfile({ onboardingDone: true }); router.replace('/(tabs)'); }
          }}
        >
          <Text style={styles.backBtnText}>{step === 0 ? 'Skip' : '← Back'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS - 1 ? '🚀 Start Reading' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060B18' },

  // Progress
  progressContainer: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', width: '100%' },
  progressBar: { height: 3, backgroundColor: '#FF9933', borderRadius: 2 },

  // Step info
  stepInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  stepCount: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  appBrand: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '700' },

  content: { flex: 1 },
  step: { flex: 1, paddingHorizontal: 20 },

  // Headings
  stepTitle: { color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 10, marginBottom: 4 },
  stepSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20, lineHeight: 20 },

  // Profession step
  profGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 16 },
  profCard: {
    width: (width - 60) / 3, borderRadius: 16, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12, alignItems: 'center', gap: 5, position: 'relative',
  },
  profCardSelected: { backgroundColor: 'rgba(255,153,51,0.12)', borderColor: '#FF9933' },
  profEmoji: { fontSize: 30 },
  profLabelHi: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  profLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, textAlign: 'center' },
  profCheck: {
    position: 'absolute', top: 6, right: 8,
    backgroundColor: '#FF9933', borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },

  // Location step
  locationLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', color: '#fff', paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, marginBottom: 10,
  },
  geoLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  geoLoadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  stateList: { maxHeight: 180 },
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stateChipSelected: { backgroundColor: '#FF9933', borderColor: '#FF9933' },
  stateChipText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  districtList: { maxHeight: 150 },
  districtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  districtChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  districtChipSelected: { backgroundColor: '#000080', borderColor: '#4444FF' },
  districtChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  // Interests step
  interestHint: { color: '#FF9933', fontSize: 12, marginTop: -12, marginBottom: 14 },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 },
  interestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  interestChipSelected: { backgroundColor: 'rgba(255,153,51,0.1)', borderColor: '#FF9933' },
  interestEmoji: { fontSize: 18 },
  interestLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  interestLabelEn: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
  interestCheck: { color: '#FF9933', fontWeight: '900', fontSize: 14, marginLeft: 2 },

  // Language step
  langOptions: { gap: 12, marginTop: 8 },
  langCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  langCardSelected: { backgroundColor: 'rgba(255,153,51,0.1)', borderColor: '#FF9933' },
  langFlag: { fontSize: 30 },
  langLabel: { color: '#fff', fontSize: 17, fontWeight: '800' },
  langSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },

  // Navigation
  navRow: { flexDirection: 'row', padding: 20, gap: 12 },
  backBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center',
  },
  backBtnText: { color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: '600' },
  nextBtn: { flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#FF9933' },
  nextBtnDisabled: { backgroundColor: 'rgba(255,153,51,0.25)' },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
