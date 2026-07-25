import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';

function TabIcon({
  focused,
  icon,
  label,
}: {
  focused: boolean;
  icon: string;
  label: string;
}) {
  const C = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={[styles.tabItem, focused && { backgroundColor: C.primary + '18' }]}>
      <Text style={[styles.tabIcon, { color: focused ? C.primary : C.tabIconDefault }]}>{icon}</Text>
      <Text style={[styles.tabLabel, { color: focused ? C.primary : C.tabIconDefault }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopColor: C.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingTop: spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? 22 : spacing.sm,
          elevation: 12,
          shadowColor: Colors.light.ink,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="H" label="Home" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Explore',
          tabBarAccessibilityLabel: 'Explore tab',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="Q" label="Explore" />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Local',
          tabBarAccessibilityLabel: 'Local and civic documents tab',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="L" label="Local" />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Video',
          tabBarAccessibilityLabel: 'Video news tab',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="V" label="Video" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="P" label="Profile" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  tabIcon: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  tabLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0 },
});
