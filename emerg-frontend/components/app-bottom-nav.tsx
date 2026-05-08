import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RED = '#E63946';

const routes = {
  Home: '/dashboard' as Href,
  Contacts: '/contacts' as Href,
  Track: '/track-request' as Href,
};

type AppTab = 'Home' | 'Contacts' | 'Track' | 'Settings';

type AppBottomNavProps = {
  activeTab: AppTab;
};

const tabs: {
  key: AppTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'Home', label: 'Home', icon: 'home' },
  { key: 'Contacts', label: 'Contacts', icon: 'call' },
  { key: 'Track', label: 'Track', icon: 'map' },
  { key: 'Settings', label: 'Settings', icon: 'settings' },
];

export function AppBottomNav({ activeTab }: AppBottomNavProps) {
  const router = useRouter();

  const handlePress = (tab: AppTab) => {
    if (tab === activeTab || tab === 'Settings') {
      return;
    }

    router.replace(routes[tab]);
  };

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <TouchableOpacity key={tab.key} style={styles.tabItem} activeOpacity={0.8} onPress={() => handlePress(tab.key)}>
            <View style={isActive ? styles.activeTabBg : styles.inactiveTabBg}>
              <Ionicons name={tab.icon} size={24} color={isActive ? RED : '#FFFFFF'} />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: RED,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBg: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTabBg: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: RED,
  },
});
