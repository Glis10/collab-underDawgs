import { AppBottomNav } from '@/components/app-bottom-nav';
import { ContactsContent } from '@/app/contacts';
import { SettingsContent } from '@/app/settings';
import { TrackRequestContent } from '@/app/track-request';
import { useAppPreferences } from '@/src/lib/app-preferences';
import { createEmergencyRequest, EmergencyRequest, getCurrentUser, getEmergencyRequests } from '@/src/lib/auth';
import { getCurrentEmergencyLocation } from '@/src/lib/location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RED = '#E63946';
const NAVY = '#1A365D';
const GREEN = '#00A86B';
const YELLOW = '#ECC94B';
const MUTED = '#718096';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';
type UserTab = 'Home' | 'Contacts' | 'Track' | 'Settings';

const emergencyActions = [
  { labelKey: 'policeHelp', icon: 'police-badge', tone: '#E63946', serviceType: 'police' },
  { labelKey: 'ambulance', icon: 'ambulance', tone: '#3182CE', serviceType: 'ambulance' },
  { labelKey: 'fireRescue', icon: 'fire-truck', tone: '#DD6B20', serviceType: 'fire_truck' },
  { labelKey: 'rescueTeam', icon: 'account-hard-hat', tone: '#00A86B', serviceType: 'rescue_team' },
] as const satisfies readonly {
  labelKey: 'policeHelp' | 'ambulance' | 'fireRescue' | 'rescueTeam';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: string;
  serviceType: 'ambulance' | 'police' | 'rescue_team' | 'fire_truck';
}[];

export default function DashboardScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const { darkMode, t } = useAppPreferences();
  const [activeTab, setActiveTab] = useState<UserTab>('Home');
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [requestHistory, setRequestHistory] = useState<EmergencyRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const fullName = currentUser?.name?.trim();
  const firstName = fullName?.split(/\s+/)[0] || fullName || 'User';

  const loadRequestHistory = useCallback(async () => {
    try {
      const requests = await getEmergencyRequests();
      setRequestHistory(requests);
    } catch {
      setRequestHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadRequestHistory();
  }, [loadRequestHistory]);

  const openService = (action: (typeof emergencyActions)[number]) => {
    const serviceLabel = encodeURIComponent(t(action.labelKey));

    router.push(`/service-request?serviceType=${action.serviceType}&serviceLabel=${serviceLabel}` as Href);
  };

  const sendSosRequests = async () => {
    try {
      setIsSendingSos(true);
      const location = await getCurrentEmergencyLocation();

      await Promise.all(
        emergencyActions.map((action) =>
          createEmergencyRequest({
            emergencyType: action.serviceType,
            emergencyDescription: 'SOS emergency request. User requested help from all emergency services.',
            userLocation: location,
          })
        )
      );
      await loadRequestHistory();

      Alert.alert('SOS sent', 'Your location has been shared with all emergency services.', [
        { text: 'Track request', onPress: () => setActiveTab('Track') },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send SOS right now.';
      Alert.alert('SOS failed', message);
    } finally {
      setIsSendingSos(false);
    }
  };

  const confirmSos = () => {
    Alert.alert(
      'Send SOS?',
      'Your live location will be shared with ambulance, police, fire rescue, and rescue team services.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send help', style: 'destructive', onPress: sendSosRequests },
      ]
    );
  };

  const handleEmergencyDrill = () => {
    Alert.alert('Emergency Drill', 'Practice mode is ready. Hold the SOS button for 3 seconds when this is a real emergency.');
  };

  const getRequestTitle = (request: EmergencyRequest) => {
    const serviceType = request.serviceType || request.emergencyType;

    if (serviceType === 'police') {
      return t('policeHelp');
    }

    if (serviceType === 'ambulance') {
      return t('ambulance');
    }

    if (serviceType === 'fire_truck') {
      return t('fireRescue');
    }

    if (serviceType === 'rescue_team') {
      return t('rescueTeam');
    }

    return 'Emergency request';
  };

  const getRequestStatus = (request: EmergencyRequest) => request.requestStatus || request.status || 'pending';

  const getStatusColor = (status: string) => {
    if (status === 'completed') {
      return GREEN;
    }

    if (status === 'rejected') {
      return RED;
    }

    if (status === 'assigned' || status === 'in_progress' || status === 'approved') {
      return '#3182CE';
    }

    return YELLOW;
  };

  const formatRequestDate = (value?: string) => {
    if (!value) {
      return 'Just now';
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const formatRequestLocation = (request: EmergencyRequest) => {
    const location = request.location || request.emergencyLocation || request.currentLocation;

    if (!location?.latitude || !location.longitude) {
      return 'Location unavailable';
    }

    return `${location.latitude}, ${location.longitude}`;
  };

  const renderHome = () => (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity
            style={[styles.profileButton, darkMode && styles.profileButtonDark]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('Settings')}
          >
            <Ionicons name="person" size={20} color={darkMode ? '#F9FAFB' : NAVY} />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroPanel, darkMode && styles.heroPanelDark]}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.welcomeLabel}>{t('welcomeBack')}</Text>
              <Text style={styles.welcomeText}>{firstName}</Text>
            </View>
            <View style={styles.readyBadge}>
              <View style={styles.readyDot} />
              <Text style={styles.readyText}>{t('ready')}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color={RED} />
              <View>
                <Text style={styles.infoLabel}>{t('currentArea')}</Text>
                <Text style={styles.infoValue}>Kathmandu</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={GREEN} />
              <View>
                <Text style={styles.infoLabel}>{t('network')}</Text>
                <Text style={styles.infoValue}>{t('online')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.sosPanel, darkMode && styles.cardDark]}>
          <View style={styles.sosCopy}>
            <Text style={[styles.sosTitle, darkMode && styles.textDark]}>{t('emergencySos')}</Text>
            <Text style={styles.sosSubtitle}>{t('sosSubtitle')}</Text>
          </View>
          <View style={styles.sosContainer}>
            <TouchableOpacity
              style={styles.sosOuterRing}
              activeOpacity={0.8}
              delayLongPress={3000}
              disabled={isSendingSos}
              onLongPress={confirmSos}
            >
              <View style={styles.sosInnerRing}>
                <View style={styles.sosButton}>
                  {isSendingSos ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="alarm-light-outline" size={46} color="#FFFFFF" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.tapText}>{t('tapHold')}</Text>
        </View>

        <View style={styles.utilityRow}>
          <TouchableOpacity style={[styles.utilityButton, darkMode && styles.cardDark]} activeOpacity={0.8} onPress={handleEmergencyDrill}>
            <Ionicons name="refresh-circle-outline" size={18} color={darkMode ? '#F9FAFB' : NAVY} />
            <Text style={[styles.utilityText, darkMode && styles.textDark]}>{t('emergencyDrill')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.utilityButton, darkMode && styles.cardDark]} activeOpacity={0.8} onPress={() => setActiveTab('Track')}>
            <Ionicons name="navigate-circle-outline" size={18} color={darkMode ? '#F9FAFB' : NAVY} />
            <Text style={[styles.utilityText, darkMode && styles.textDark]}>{t('trackActive')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{t('quickHelp')}</Text>
          <Text style={styles.sectionHint}>{t('chooseService')}</Text>
        </View>
        <View style={styles.gridContainer}>
          {emergencyActions.map((action) => (
            <TouchableOpacity key={action.labelKey} style={[styles.gridItem, darkMode && styles.cardDark]} activeOpacity={0.82} onPress={() => openService(action)}>
              <View style={[styles.gridIcon, { backgroundColor: `${action.tone}14` }]}>
                <MaterialCommunityIcons name={action.icon} size={31} color={action.tone} />
              </View>
              <Text style={[styles.gridItemText, darkMode && styles.textDark]}>{t(action.labelKey)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.gridItem, darkMode && styles.cardDark]} onPress={() => setActiveTab('Track')}>
            <View style={styles.gridIcon}>
              <Ionicons name="navigate" size={31} color={RED} />
            </View>
            <Text style={[styles.gridItemText, darkMode && styles.textDark]}>{t('trackRequest')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{t('recentRequests')}</Text>
            <Text style={styles.sectionHint}>{t('lastActivity')}</Text>
          </View>

          {isLoadingHistory ? (
            <View style={[styles.historyCard, darkMode && styles.cardDark]}>
              <ActivityIndicator color={RED} />
            </View>
          ) : requestHistory.length > 0 ? (
            requestHistory.map((request) => {
              const status = getRequestStatus(request);

              return (
            <View key={request.id} style={[styles.historyCard, darkMode && styles.cardDark]}>
              <View style={[styles.historyIcon, darkMode && styles.historyIconDark]}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color={darkMode ? '#F9FAFB' : NAVY} />
              </View>
              <View style={styles.historyCardLeft}>
                <Text style={[styles.historyCardTitle, darkMode && styles.textDark]}>{getRequestTitle(request)}</Text>
                <Text style={styles.historyCardDate}>{formatRequestDate(request.requestTime || request.createdAt)}</Text>
                <Text style={styles.historyCardLocation}>{formatRequestLocation(request)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.badgeText}>{status.replace(/_/g, ' ')}</Text>
              </View>
            </View>
              );
            })
          ) : (
            <View style={[styles.historyCard, darkMode && styles.cardDark]}>
              <View style={[styles.historyIcon, darkMode && styles.historyIconDark]}>
                <MaterialCommunityIcons name="history" size={20} color={darkMode ? '#F9FAFB' : NAVY} />
              </View>
              <View style={styles.historyCardLeft}>
                <Text style={[styles.historyCardTitle, darkMode && styles.textDark]}>No requests yet</Text>
                <Text style={styles.historyCardDate}>Your real request history will appear here.</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>
  );

  const renderContent = () => {
    if (activeTab === 'Contacts') {
      return <ContactsContent bottomSpacer={96} />;
    }

    if (activeTab === 'Track') {
      return <TrackRequestContent bottomSpacer={96} onGoHome={() => setActiveTab('Home')} />;
    }

    if (activeTab === 'Settings') {
      return <SettingsContent bottomSpacer={96} />;
    }

    return renderHome();
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top', 'left', 'right']}>
      {renderContent()}

      <AppBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE },
  containerDark: { backgroundColor: '#050505' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  logo: { width: 150, height: 50 },
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  profileButtonDark: { backgroundColor: '#121212', borderColor: '#2A2A2A' },
  heroPanel: { backgroundColor: NAVY, borderRadius: 8, marginBottom: 16, padding: 16 },
  heroPanelDark: { backgroundColor: '#0B0B0B', borderColor: '#2A2A2A', borderWidth: 1 },
  heroTopRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  welcomeLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 13, fontWeight: '700' },
  welcomeText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 2 },
  readyBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 8, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7 },
  readyDot: { backgroundColor: GREEN, borderRadius: 4, height: 8, marginRight: 6, width: 8 },
  readyText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  infoRow: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, flexDirection: 'row', marginTop: 16, padding: 12 },
  infoItem: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 },
  infoDivider: { backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 10, width: 1 },
  infoLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11, fontWeight: '700' },
  infoValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginTop: 1 },
  sosPanel: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: BORDER, borderRadius: 8, borderWidth: 1, marginBottom: 14, padding: 18 },
  sosCopy: { alignItems: 'center' },
  sosTitle: { color: NAVY, fontSize: 22, fontWeight: '900' },
  sosSubtitle: { color: MUTED, fontSize: 13, fontWeight: '600', lineHeight: 18, marginTop: 5, maxWidth: 260, textAlign: 'center' },
  sosContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 18 },
  sosOuterRing: { width: 158, height: 158, borderRadius: 79, backgroundColor: 'rgba(230, 57, 70, 0.1)', alignItems: 'center', justifyContent: 'center' },
  sosInnerRing: { width: 122, height: 122, borderRadius: 61, backgroundColor: 'rgba(230, 57, 70, 0.28)', alignItems: 'center', justifyContent: 'center' },
  sosButton: { width: 88, height: 88, borderRadius: 44, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  tapText: { textAlign: 'center', color: MUTED, fontSize: 13, fontWeight: '700' },
  utilityRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  utilityButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: BORDER, borderRadius: 8, borderWidth: 1, flex: 1, flexDirection: 'row', height: 48, justifyContent: 'center' },
  utilityText: { color: NAVY, fontSize: 14, fontWeight: '800', marginLeft: 7 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: '#111827', fontSize: 20, fontWeight: '900' },
  sectionHint: { color: MUTED, fontSize: 12, fontWeight: '800' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 22 },
  gridItem: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, minHeight: 122, justifyContent: 'space-between', marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  gridIcon: { alignItems: 'center', backgroundColor: '#FFF1F2', borderRadius: 8, height: 48, justifyContent: 'center', width: 48 },
  gridItemText: { fontSize: 15, fontWeight: '900', color: NAVY, lineHeight: 20 },
  historySection: { marginTop: 2 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, marginBottom: 10 },
  cardDark: { backgroundColor: '#121212', borderColor: '#2A2A2A' },
  textDark: { color: '#F9FAFB' },
  historyIcon: { alignItems: 'center', backgroundColor: SURFACE, borderRadius: 8, height: 42, justifyContent: 'center', marginRight: 11, width: 42 },
  historyIconDark: { backgroundColor: '#050505' },
  historyCardLeft: { flex: 1 },
  historyCardTitle: { fontSize: 16, fontWeight: '900', color: NAVY, marginBottom: 3 },
  historyCardDate: { fontSize: 12, color: FAINT, fontWeight: '700', marginBottom: 4 },
  historyCardLocation: { fontSize: 13, color: MUTED, fontWeight: '700' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
