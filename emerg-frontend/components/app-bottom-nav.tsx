import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppPreferences } from '@/src/lib/app-preferences';

const RED = '#E63946';

type AppTab = 'Home' | 'Contacts' | 'Track' | 'Settings';

const routes: Partial<Record<AppTab, Href>> = {
  Home: '/dashboard' as Href,
  Contacts: '/contacts' as Href,
  Track: '/track-request' as Href,
  Settings: '/settings' as Href,
};

const tabs = [
  { key: 'Home', label: 'Home', icon: 'home' },
  { key: 'Contacts', label: 'Contacts', icon: 'call' },
  { key: 'Track', label: 'Track', icon: 'map' },
  { key: 'Settings', label: 'Settings', icon: 'settings' },
] as const satisfies readonly {
  key: AppTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[];

type AppBottomNavProps = {
  activeTab: AppTab;
};

export function AppBottomNav({ activeTab }: AppBottomNavProps) {
  const router = useRouter();
  const { darkMode, t } = useAppPreferences();

  const handlePress = (tab: AppTab) => {
    const route = routes[tab];

    if (!route || tab === activeTab) {
      return;
    }

    router.replace(route);
  };

  return (
    <View style={[styles.bottomTabBar, darkMode && styles.bottomTabBarDark]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const labelKey = tab.key.charAt(0).toLowerCase() + tab.key.slice(1) as 'home' | 'contacts' | 'track' | 'settings';

        return (
          <TouchableOpacity key={tab.key} style={styles.tabItem} activeOpacity={0.8} onPress={() => handlePress(tab.key)}>
            <View style={isActive ? styles.activeTabBg : styles.inactiveTabBg}>
              <Ionicons name={tab.icon} size={24} color={isActive ? RED : '#FFFFFF'} />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{t(labelKey)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    alignItems: 'center',
    backgroundColor: RED,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    flexDirection: 'row',
    height: 80,
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 20,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
  },
  bottomTabBarDark: {
    backgroundColor: '#101010',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBg: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inactiveTabBg: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  activeTabText: {
    color: RED,
  },
});
