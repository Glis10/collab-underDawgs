import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { getCurrentUser, logoutUser, updateCurrentUserName } from '@/src/lib/auth';
import { useAppPreferences } from '@/src/lib/app-preferences';

const RED = '#E63946';
const BORDER = '#E2E8F0';
const LIGHT_RED = '#FFF1F2';
const signInRoute = '/UserSignIn' as Href;
const changePasswordRoute = '/change-password' as Href;

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
};

function SettingRow({ icon, label, value, onValueChange, onPress }: SettingRowProps) {
  const isSwitch = typeof value === 'boolean';
  const { darkMode } = useAppPreferences();

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
        <Text style={[styles.settingLabel, darkMode && styles.textDark]}>{label}</Text>
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
        <Ionicons name="chevron-forward" size={22} color={darkMode ? '#F9FAFB' : '#111827'} />
      )}
    </TouchableOpacity>
  );
}

type SettingsContentProps = {
  bottomSpacer?: number;
};

export function SettingsContent({ bottomSpacer = 96 }: SettingsContentProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const currentUser = getCurrentUser();
  const { darkMode, language, setDarkMode, setLanguage, t } = useAppPreferences();
  const [notifications, setNotifications] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);

  const [savedName, setSavedName] = useState(currentUser?.name || 'User');
  const displayName = savedName;
  const displayEmail = currentUser?.email || 'teacher@heraldcollege.np';
  const [draftName, setDraftName] = useState(displayName);

  const confirmLogout = useCallback(() => {
    Alert.alert(t('logoutConfirmTitle'), t('logoutConfirmMessage'), [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: () => {
          logoutUser();
          router.replace(signInRoute);
        },
      },
    ]);
  }, [router, t]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        confirmLogout();
        return true;
      });

      return () => subscription.remove();
    }, [confirmLogout])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      const actionType = event.data.action.type;

      if (actionType !== 'GO_BACK' && actionType !== 'POP') {
        return;
      }

      event.preventDefault();
      confirmLogout();
    });

    return unsubscribe;
  }, [confirmLogout, navigation]);

  const handleChangePassword = () => {
    router.push(changePasswordRoute);
  };

  const handleSaveName = () => {
    const nextName = draftName.trim();

    if (!nextName) {
      return;
    }

    updateCurrentUserName(nextName);
    setSavedName(nextName);
    setIsEditingName(false);
  };

  return (
      <ScrollView contentContainerStyle={[styles.scrollContent, darkMode && styles.scrollContentDark]} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileSection, darkMode && styles.profileSectionDark]}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>

          <View style={[styles.namePill, darkMode && styles.cardDark]}>
            <Text style={[styles.profileName, darkMode && styles.textDark]}>{displayName}</Text>
            <Text style={[styles.profileEmail, darkMode && styles.mutedTextDark]}>{displayEmail}</Text>
          </View>
        </View>

        <View style={[styles.settingsCard, darkMode && styles.cardDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{t('personalInfo')}</Text>
          <SettingRow
            icon="person-outline"
            label={t('editName')}
            onPress={() => setIsEditingName((current) => !current)}
          />

          {isEditingName && (
            <View style={styles.editNamePanel}>
              <Text style={[styles.inputLabel, darkMode && styles.mutedTextDark]}>{t('fullName')}</Text>
              <TextInput
                style={[styles.nameInput, darkMode && styles.nameInputDark]}
                value={draftName}
                onChangeText={setDraftName}
                placeholder={t('fullName')}
                placeholderTextColor={darkMode ? '#9CA3AF' : '#A0AEC0'}
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditingName(false)}>
                  <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveNameButton} onPress={handleSaveName}>
                  <Text style={styles.saveNameText}>{t('saveName')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.sectionGap} />

          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{t('preference')}</Text>
          <SettingRow
            icon="moon"
            label={t('darkMode')}
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingRow
            icon="notifications"
            label={t('notifications')}
            value={notifications}
            onValueChange={setNotifications}
          />

          <View style={styles.sectionGapSmall} />

          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{t('language')}</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelWrap}>
              <View style={styles.rowIconWrap}>
                <MaterialCommunityIcons name="translate" size={18} color={RED} />
              </View>
              <Text style={[styles.settingLabel, darkMode && styles.textDark]}>{language === 'ne' ? t('nepali') : t('english')}</Text>
            </View>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
                onPress={() => setLanguage('en')}>
                <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>{t('english')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageOption, language === 'ne' && styles.languageOptionActive]}
                onPress={() => setLanguage('ne')}>
                <Text style={[styles.languageText, language === 'ne' && styles.languageTextActive]}>{t('nepali')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionGapSmall} />

          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{t('security')}</Text>
          <SettingRow icon="lock-closed-outline" label={t('changePassword')} onPress={handleChangePassword} />
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={confirmLogout}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: bottomSpacer }} />
      </ScrollView>
  );
}

export default function SettingsScreen() {
  const { darkMode } = useAppPreferences();

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top', 'left', 'right']}>
      <SettingsContent bottomSpacer={96} />

      <AppBottomNav activeTab="Settings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  containerDark: {
    backgroundColor: '#050505',
  },
  scrollContent: {
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 28,
    paddingTop: 48,
  },
  scrollContentDark: {
    backgroundColor: '#050505',
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    marginHorizontal: -28,
    marginTop: -48,
    paddingBottom: 72,
    paddingTop: 50,
  },
  profileSectionDark: {
    backgroundColor: '#0B0B0B',
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
  textDark: {
    color: '#F9FAFB',
  },
  mutedTextDark: {
    color: '#CBD5E1',
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
  cardDark: {
    backgroundColor: '#121212',
    borderColor: '#2A2A2A',
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
  editNamePanel: {
    marginTop: 12,
  },
  inputLabel: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  nameInput: {
    backgroundColor: '#F7FAFC',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  nameInputDark: {
    backgroundColor: '#050505',
    borderColor: '#2A2A2A',
    color: '#F9FAFB',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },
  saveNameButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
  },
  saveNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  languageToggle: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 3,
  },
  languageOption: {
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  languageOptionActive: {
    backgroundColor: RED,
  },
  languageText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '800',
  },
  languageTextActive: {
    color: '#FFFFFF',
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
