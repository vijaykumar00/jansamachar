// JanSamachar — Push Notification Service
// Daily news digest at 8 AM + breaking news alerts for user's district

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../store/userProfileStore';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PUSH_TOKEN_KEY = 'jansamachar_push_token';
const LAST_NOTIF_KEY = 'jansamachar_last_notif_ids';

/**
 * Request notification permission and get Expo push token.
 * Must be called on a real device (not emulator).
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a real device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission denied');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    console.log('[Notifications] Push token:', token);
    return token;
  } catch (e) {
    console.warn('[Notifications] Failed to get push token:', e);
    return null;
  }
}

/**
 * Schedule a daily morning news digest notification at 8:00 AM.
 * Cancels any existing digest before scheduling a new one.
 */
export async function scheduleDailyDigest(profile: UserProfile): Promise<void> {
  // Cancel old daily digest if exists
  await Notifications.cancelAllScheduledNotificationsAsync();

  const title = `📰 ${profile.districtName} की आज की खबरें`;
  const body = [
    profile.stateName + ' और राष्ट्रीय समाचार तैयार हैं।',
    `आपकी पसंद: ${profile.interests.slice(0, 2).join(', ')}`,
    'खबरें देखने के लिए टैप करें।',
  ].join(' ');

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { screen: '/(tabs)', section: 'district' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  // Also schedule an evening update at 6 PM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🌆 ${profile.districtName} — शाम की खबरें`,
      body: `${profile.stateName} की ताज़ा अपडेट। देखें क्या हुआ आज।`,
      data: { screen: '/(tabs)', section: 'state' },
      sound: false, // silent evening notification
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
    },
  });

  console.log(`[Notifications] Daily digest scheduled for ${profile.districtName}`);
}

/**
 * Send an immediate breaking news notification for the user's district.
 */
export async function sendBreakingAlert(headline: string, districtName: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔴 Breaking: ${districtName}`,
      body: headline,
      data: { screen: '/(tabs)', section: 'district' },
      sound: true,
    },
    trigger: null, // immediate
  });
}

/**
 * Check for new news items and notify if found.
 * Compare against last-seen IDs stored in AsyncStorage.
 */
export async function checkAndNotifyNewNews(
  districtName: string,
  latestIds: string[],
  latestTitles: string[]
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LAST_NOTIF_KEY);
    const lastIds: string[] = stored ? JSON.parse(stored) : [];

    const newIds = latestIds.filter(id => !lastIds.includes(id));

    if (newIds.length > 0 && latestTitles[0]) {
      await sendBreakingAlert(latestTitles[0], districtName);
    }

    // Save current IDs as last seen
    await AsyncStorage.setItem(LAST_NOTIF_KEY, JSON.stringify(latestIds));
  } catch (e) {
    console.warn('[Notifications] checkAndNotify error:', e);
  }
}

/**
 * Handle notification tap — navigate to correct screen.
 * Call this in the root _layout.tsx
 */
export function setupNotificationTapHandler(
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data?.screen) {
      onNavigate(String(data.screen), data);
    }
  });
  return () => sub.remove();
}
