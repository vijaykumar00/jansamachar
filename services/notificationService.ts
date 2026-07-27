import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { UserProfile } from '../store/userProfileStore';

type NotificationsApi = typeof import('expo-notifications');
type DeviceApi = typeof import('expo-device');
type ConstantsApi = typeof import('expo-constants');

const PUSH_TOKEN_KEY = 'jansamachar_push_token';
const LAST_NOTIF_KEY = 'jansamachar_last_notif_ids';
const SCHEDULE_KEY = 'jansamachar_notification_schedule_v1';

let notificationsApi: NotificationsApi | null | undefined;
let deviceApi: DeviceApi | null | undefined;
let constantsApi: ConstantsApi | null | undefined;
let notificationHandlerConfigured = false;

export async function requestNotificationPermission(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (!(await canRegisterExpoPushToken())) return 'local-permission-granted';

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, tokenData.data);
    return tokenData.data;
  } catch (e) {
    console.warn('[Notifications] Failed to get push token:', e);
    return 'local-permission-granted';
  }
}

export async function configureNewsNotifications(
  profile: UserProfile,
  options: { requestPermission?: boolean } = {}
): Promise<void> {
  if (!profile.breakingAlerts || profile.notificationBudgetPerDay <= 0) {
    await cancelNewsNotifications();
    return;
  }

  const hasPermission = options.requestPermission
    ? Boolean(await requestNotificationPermission())
    : await notificationPermissionGranted();

  if (!hasPermission) return;

  const scheduleKey = [
    profile.stateName,
    profile.districtName,
    profile.localityName || '',
    profile.language,
    profile.notificationBudgetPerDay,
    profile.interests.slice(0, 3).join(','),
  ].join('|');

  const lastScheduleKey = await AsyncStorage.getItem(SCHEDULE_KEY);
  if (lastScheduleKey === scheduleKey) return;

  await scheduleDailyDigest(profile);
  await AsyncStorage.setItem(SCHEDULE_KEY, scheduleKey);
}

export async function scheduleDailyDigest(profile: UserProfile): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const place = profile.localityName || profile.districtName || profile.stateName || 'your area';
  const interestText = profile.interests.slice(0, 2).join(', ') || 'local updates';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${place} morning news brief`,
      body: `Latest local, state, and national updates are ready. Focus: ${interestText}.`,
      data: { screen: '/(tabs)', section: 'district', source: 'daily_digest' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  if (profile.notificationBudgetPerDay >= 2) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${place} evening update`,
        body: `Catch up on important stories from ${profile.stateName || 'your state'} before the day ends.`,
        data: { screen: '/(tabs)', section: 'state', source: 'evening_digest' },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 0,
      },
    });
  }
}

export async function cancelNewsNotifications(): Promise<void> {
  const Notifications = await getNotifications();
  if (Notifications) await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(SCHEDULE_KEY);
}

export async function sendBreakingAlert(headline: string, districtName: string): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications || !(await notificationPermissionGranted())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Breaking: ${districtName}`,
      body: headline,
      data: { screen: '/(tabs)', section: 'district', source: 'breaking_alert' },
      sound: true,
    },
    trigger: null,
  });
}

export async function checkAndNotifyNewNews(
  districtName: string,
  latestIds: string[],
  latestTitles: string[]
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LAST_NOTIF_KEY);
    const lastIds: string[] = stored ? JSON.parse(stored) : [];

    if (lastIds.length === 0) {
      await AsyncStorage.setItem(LAST_NOTIF_KEY, JSON.stringify(latestIds));
      return;
    }

    const newIds = latestIds.filter((id) => !lastIds.includes(id));

    if (newIds.length > 0 && latestTitles[0]) {
      await sendBreakingAlert(latestTitles[0], districtName);
    }

    await AsyncStorage.setItem(LAST_NOTIF_KEY, JSON.stringify(latestIds));
  } catch (e) {
    console.warn('[Notifications] checkAndNotify error:', e);
  }
}

export function setupNotificationTapHandler(
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
): () => void {
  let cancelled = false;
  let removeListener: (() => void) | null = null;

  void getNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen) onNavigate(String(data.screen), data);
    });
    removeListener = () => sub.remove();
  });

  return () => {
    cancelled = true;
    removeListener?.();
  };
}

async function notificationPermissionGranted(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function getNotifications(): Promise<NotificationsApi | null> {
  if (notificationsApi !== undefined) return notificationsApi;

  try {
    if (Platform.OS === 'web' || await isExpoGoRuntime()) {
      notificationsApi = null;
      return null;
    }

    const module = await import('expo-notifications');
    notificationsApi = module;
    configureNotificationHandler(module);
    return module;
  } catch (e) {
    console.warn('[Notifications] Module unavailable:', e);
    notificationsApi = null;
    return null;
  }
}

async function isExpoGoRuntime(): Promise<boolean> {
  const Constants = await getConstants();
  const constants = Constants?.default;
  return constants?.appOwnership === 'expo' || constants?.executionEnvironment === 'storeClient';
}

async function getDevice(): Promise<DeviceApi | null> {
  if (deviceApi !== undefined) return deviceApi;

  try {
    deviceApi = await import('expo-device');
    return deviceApi;
  } catch {
    deviceApi = null;
    return null;
  }
}

async function getConstants(): Promise<ConstantsApi | null> {
  if (constantsApi !== undefined) return constantsApi;

  try {
    constantsApi = await import('expo-constants');
    return constantsApi;
  } catch {
    constantsApi = null;
    return null;
  }
}

async function canRegisterExpoPushToken(): Promise<boolean> {
  const [Device, Constants] = await Promise.all([getDevice(), getConstants()]);
  if (!Device?.isDevice) return false;

  const constants = Constants?.default;
  return constants?.appOwnership !== 'expo' && constants?.executionEnvironment !== 'storeClient';
}

function configureNotificationHandler(Notifications: NotificationsApi) {
  if (notificationHandlerConfigured) return;
  notificationHandlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
