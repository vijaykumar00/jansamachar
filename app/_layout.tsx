import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { trackEvent } from '@/services/analyticsService';
import { configureNewsNotifications, setupNotificationTapHandler } from '@/services/notificationService';
import { useProfileStore, useResolvedColorScheme } from '@/store/userProfileStore';
import { useEngagementStore } from '@/store/engagementStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});

function NavigationController() {
  const { profile, isLoaded, loadProfile } = useProfileStore();
  const loadEngagement = useEngagementStore((state) => state.loadEngagement);

  useEffect(() => {
    loadProfile();
    loadEngagement();
    void trackEvent('app_opened');
  }, [loadEngagement, loadProfile]);

  useEffect(() => {
    if (!isLoaded) return;
    // Redirect to onboarding if not done
    if (!profile.onboardingDone) {
      router.replace('/onboarding');
    }
  }, [isLoaded, profile.onboardingDone]);

  useEffect(() => {
    if (!isLoaded || !profile.onboardingDone) return;
    void configureNewsNotifications(profile);
  }, [
    isLoaded,
    profile.onboardingDone,
    profile.stateName,
    profile.districtName,
    profile.localityName,
    profile.language,
    profile.notificationBudgetPerDay,
    profile.breakingAlerts,
    profile.interests.join(','),
  ]);

  useEffect(() => {
    return setupNotificationTapHandler((screen) => {
      router.push(screen as any);
    });
  }, []);

  return null;
}

export default function RootLayout() {
  const colorScheme = useResolvedColorScheme();
  const [loaded] = useFonts({
    Lora: require('../assets/fonts/Lora-Regular.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationController />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </QueryClientProvider>
  );
}
