import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  useColorScheme, Switch, Alert, Linking, StatusBar,
} from 'react-native';
import { Colors } from '@/constants/colors';

const MENU_ITEMS = [
  { icon: '📰', label: 'मेरी खबरें', sublabel: 'My submitted news', onPress: () => Alert.alert('Coming Soon', 'News submission feature requires Supabase setup.') },
  { icon: '💾', label: 'सेव की गई खबरें', sublabel: 'Saved articles', onPress: () => Alert.alert('Coming Soon', 'Save feature coming in v1.1') },
  { icon: '🔔', label: 'Notifications', sublabel: 'Breaking news alerts', onPress: () => Alert.alert('Notifications', 'Setup with Expo push notifications + Firebase FCM') },
  { icon: '✊', label: 'RTI दायर करें', sublabel: 'File Right to Information', onPress: () => Linking.openURL('https://rtionline.gov.in') },
  { icon: '⚖️', label: 'Consumer Forum', sublabel: 'File consumer complaint', onPress: () => Linking.openURL('https://consumerhelpline.gov.in') },
  { icon: '📞', label: 'PM Helpline', sublabel: '1800-11-0031 (Free)', onPress: () => Linking.openURL('tel:18001100031') },
  { icon: '🌐', label: 'Govt Portals', sublabel: 'data.gov.in, PIB, MCA21', onPress: () => Linking.openURL('https://data.gov.in') },
];

const ABOUT_LINKS = [
  { label: 'About JanSamachar', url: '#' },
  { label: 'Report a Bug', url: '#' },
  { label: 'Privacy Policy', url: '#' },
  { label: 'Terms of Service', url: '#' },
  { label: 'Open Source Credits', url: 'https://github.com' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const [darkModeEnabled, setDarkModeEnabled] = useState(isDark);
  const [hindiFirst, setHindiFirst] = useState(true);
  const [breakingAlerts, setBreakingAlerts] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    Alert.alert(
      'Login / Sign Up',
      'Choose your preferred login method:',
      [
        { text: '📱 Phone OTP (India)', onPress: () => Alert.alert('OTP Login', 'Requires MSG91 / Supabase Auth setup with phone OTP.') },
        { text: '🔵 Google', onPress: () => Alert.alert('Google Login', 'Requires Supabase Google OAuth setup.') },
        { text: '📘 Facebook', onPress: () => Alert.alert('Facebook Login', 'Requires Supabase Facebook OAuth setup.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.secondary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.secondary, borderBottomColor: C.primary }]}>
        <Text style={styles.headerTitle}>👤 प्रोफाइल • Profile</Text>
        <Text style={styles.headerSub}>JanSamachar v1.0 — असली खबर</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Login Card */}
        {!isLoggedIn ? (
          <View style={[styles.loginCard, { backgroundColor: C.card, borderColor: C.primary + '40' }]}>
            <Text style={{ fontSize: 48 }}>🇮🇳</Text>
            <Text style={[styles.loginTitle, { color: C.text }]}>JanSamachar में लॉगिन करें</Text>
            <Text style={[styles.loginSub, { color: C.textSecondary }]}>
              खबर पोस्ट करें, लाइव जाएं, और दस्तावेज़ शेयर करें
            </Text>
            <View style={styles.loginBtns}>
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: '#25D366' }]}
                onPress={handleLogin}
              >
                <Text style={styles.loginBtnText}>📱 Phone OTP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: '#4285F4' }]}
                onPress={handleLogin}
              >
                <Text style={styles.loginBtnText}>🔵 Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: '#1877F2' }]}
                onPress={handleLogin}
              >
                <Text style={styles.loginBtnText}>📘 Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.userCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.avatar, { backgroundColor: C.primary }]}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
            <Text style={[styles.userName, { color: C.text }]}>Citizen Reporter</Text>
            <Text style={[styles.userBadge, { color: C.primary }]}>🟡 Unverified • 0 posts</Text>
          </View>
        )}

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>⚙️ Settings</Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: C.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSubLabel, { color: C.textMuted }]}>Saves battery on AMOLED</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.divider }]} />

          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: C.text }]}>Hindi First 🇮🇳</Text>
              <Text style={[styles.settingSubLabel, { color: C.textMuted }]}>Show Hindi content first</Text>
            </View>
            <Switch
              value={hindiFirst}
              onValueChange={setHindiFirst}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.divider }]} />

          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: C.text }]}>🔔 Breaking Alerts</Text>
              <Text style={[styles.settingSubLabel, { color: C.textMuted }]}>Instant notification for big news</Text>
            </View>
            <Switch
              value={breakingAlerts}
              onValueChange={setBreakingAlerts}
              trackColor={{ false: C.border, true: C.live }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>🚀 Quick Actions</Text>
          {MENU_ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
                  <Text style={[styles.menuSub, { color: C.textMuted }]}>{item.sublabel}</Text>
                </View>
                <Text style={[styles.menuArrow, { color: C.textMuted }]}>→</Text>
              </TouchableOpacity>
              {i < MENU_ITEMS.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Trust Levels Info */}
        <View style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>🔒 Trust System</Text>
          {[
            { icon: '🟢', label: 'Verified', desc: 'Professional journalists & outlets' },
            { icon: '▶️', label: 'YouTube', desc: 'Trusted YouTube channels' },
            { icon: '🏛️', label: 'Official', desc: 'Government official sources' },
            { icon: '🟡', label: 'Citizen', desc: 'Unverified community reports' },
            { icon: '📄', label: 'Doc', desc: 'Has proof document attached' },
            { icon: '🤖', label: 'AI', desc: 'AI-verified cross-referenced' },
          ].map((t) => (
            <View key={t.label} style={styles.trustRow}>
              <Text style={{ fontSize: 18 }}>{t.icon}</Text>
              <View>
                <Text style={[styles.trustLabel, { color: C.text }]}>{t.label}</Text>
                <Text style={[styles.trustDesc, { color: C.textMuted }]}>{t.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* About */}
        <View style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>ℹ️ About</Text>
          {ABOUT_LINKS.map((link) => (
            <TouchableOpacity key={link.label} style={styles.aboutRow} onPress={() => Linking.openURL(link.url)}>
              <Text style={[styles.aboutLabel, { color: C.textSecondary }]}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mission Statement */}
        <View style={[styles.missionCard, { borderColor: C.primary + '40' }]}>
          <Text style={[styles.missionText, { color: C.textSecondary }]}>
            🇮🇳 JanSamachar — "असली खबर, असली ज़िम्मेदारी"{'\n\n'}
            A people-first platform for real, ground-level journalism.{'\n'}
            No corporate bias. No government agenda.{'\n'}
            Built for India, by India.
          </Text>
          <Text style={[styles.missionVersion, { color: C.textMuted }]}>v1.0.0 • Demo Mode</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 3,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3 },
  content: { padding: 16, gap: 16 },

  loginCard: {
    borderRadius: 16, borderWidth: 2, padding: 24,
    alignItems: 'center', gap: 10,
  },
  loginTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  loginSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  loginBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 },
  loginBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  userCard: {
    borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 18, fontWeight: '700' },
  userBadge: { fontSize: 13, fontWeight: '600' },

  section: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8,
  },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingSubLabel: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 4 },

  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuIcon: { fontSize: 22, width: 32 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600' },
  menuSub: { fontSize: 12, marginTop: 1 },
  menuArrow: { fontSize: 18 },

  trustRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  trustLabel: { fontSize: 13, fontWeight: '700' },
  trustDesc: { fontSize: 12, marginTop: 1 },

  aboutRow: { paddingVertical: 10 },
  aboutLabel: { fontSize: 14 },

  missionCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 20, borderStyle: 'dashed',
  },
  missionText: { fontSize: 13.5, lineHeight: 22, textAlign: 'center' },
  missionVersion: { textAlign: 'center', fontSize: 11, marginTop: 12 },
});
