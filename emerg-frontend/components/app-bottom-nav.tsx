import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RED = '#E63946';

const tabs = [
  { label: 'Home', icon: 'home', route: '/dashboard' },
  { label: 'Contacts', icon: 'call', route: '/contacts' },
  { label: 'Track', icon: 'map', route: '/track-request' },
  { label: 'Settings', icon: 'settings', route: '/dashboard' },
] as const satisfies readonly {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[];

type AppBottomNavProps = {
  activeTab: (typeof tabs)[number]['label'];
};

export function AppBottomNav({ activeTab }: AppBottomNavProps) {
  const router = useRouter();

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label;

        return (
          <TouchableOpacity
            key={tab.label}
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => router.replace(tab.route as Href)}
          >
            <View style={isActive ? styles.activeTabBg : styles.inactiveTabBg}>
              <Ionicons name={tab.icon} size={24} color={isActive ? RED : '#FFFFFF'} />
              <Text style={[styles.tabText, { color: isActive ? RED : '#FFFFFF' }]}>{tab.label}</Text>
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
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
