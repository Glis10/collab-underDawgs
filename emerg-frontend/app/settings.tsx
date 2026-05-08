import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { getCurrentUser, logoutUser } from '@/src/lib/auth';

const RED = '#E63946';
const BORDER = '#E2E8F0';
const LIGHT_RED = '#FFF1F2';
const signInRoute = '/UserSignIn' as Href;

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
};

function SettingRow({ icon, label, value, onValueChange, onPress }: SettingRowProps) {
  const isSwitch = typeof value === 'boolean';

  return (
    <TouchableOpacity
      style={styles.settingRow}
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLabelWrap}>
        <View style={styles.rowIconWrap}>
          <Ionicons name={icon} size={18} color={RED} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>

      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#A0AEC0', true: RED }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#A0AEC0"
        />
      ) : (
        <Ionicons name="chevron-forward" size={22} color="#111827" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const [personalDarkMode, setPersonalDarkMode] = useState(true);
  const [preferenceDarkMode, setPreferenceDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [nepali, setNepali] = useState(false);

  const displayName = currentUser?.name || 'Pujan Singh';
  const displayEmail = currentUser?.email || 'teacher@heraldcollege.np';

  const handleLogout = () => {
    logoutUser();
    router.replace(signInRoute);
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change flow is available from Forgot Password.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>

          <View style={styles.namePill}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <SettingRow
            icon="moon"
            label="Dark Mode"
            value={personalDarkMode}
            onValueChange={setPersonalDarkMode}
          />

          <View style={styles.sectionGap} />

          <Text style={styles.sectionTitle}>Preference</Text>
          <SettingRow
            icon="moon"
            label="Dark Mode"
            value={preferenceDarkMode}
            onValueChange={setPreferenceDarkMode}
          />
          <SettingRow
            icon="notifications"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />

          <View style={styles.sectionGapSmall} />

          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelWrap}>
              <View style={styles.rowIconWrap}>
                <MaterialCommunityIcons name="translate" size={18} color={RED} />
              </View>
              <Text style={styles.settingLabel}>Nepali</Text>
            </View>
            <Switch
              value={nepali}
              onValueChange={setNepali}
              trackColor={{ false: '#A0AEC0', true: RED }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#A0AEC0"
            />
          </View>

          <View style={styles.sectionGapSmall} />

          <Text style={styles.sectionTitle}>Security</Text>
          <SettingRow icon="lock-closed-outline" label="Change Password" onPress={handleChangePassword} />
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 96 }} />
      </ScrollView>

      <AppBottomNav activeTab="Settings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 28,
    paddingTop: 48,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    marginHorizontal: -28,
    marginTop: -48,
    paddingBottom: 72,
    paddingTop: 50,
  },
  avatarOuter: {
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 56,
    height: 112,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    paddingTop: 14,
    width: 112,
  },
  avatarHead: {
    backgroundColor: '#5E5E5E',
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  avatarBody: {
    backgroundColor: '#5E5E5E',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    height: 66,
    marginTop: 10,
    width: 88,
  },
  namePill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    bottom: 50,
    minWidth: 176,
    paddingHorizontal: 18,
    paddingVertical: 8,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  profileName: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#000000',
    fontSize: 11,
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: -34,
    paddingHorizontal: 22,
    paddingVertical: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionGap: {
    height: 26,
  },
  sectionGapSmall: {
    height: 18,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
  },
  settingLabelWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  rowIconWrap: {
    alignItems: 'center',
    backgroundColor: LIGHT_RED,
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    marginRight: 8,
    width: 28,
  },
  settingLabel: {
    color: '#111827',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    marginTop: 34,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
