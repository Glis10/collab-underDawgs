import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppPreferences } from '@/src/lib/app-preferences';
import {
  AdminEmergencyRequest,
  approveAdminEmergencyRequest,
  getAdminEmergencyRequests,
  getCurrentUser,
  logoutUser,
  rejectAdminEmergencyRequest,
  resolveAdminEmergencyRequest,
  updateCurrentUserName,
} from '@/src/lib/auth';

const RED = '#E63946';
const NAVY = '#1A365D';
const GREEN = '#00A86B';
const BLUE = '#3182CE';
const MUTED = '#718096';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';
const LIGHT_RED = '#FFF1F2';
const adminSignInRoute = '/AdminSignIn' as Href;
const adminChangePasswordRoute = '/admin-change-password' as Href;

type AdminTab = 'Overview' | 'Alerts' | 'Map' | 'Settings' | 'Resolved';
type RequestStatus = 'incoming' | 'assigned' | 'completed';
type ResponderStatus = 'available' | 'unavailable' | 'busy';
type AdminTextKey =
  | 'overview'
  | 'alerts'
  | 'map'
  | 'settings'
  | 'resolved'
  | 'welcomeBack'
  | 'available'
  | 'unavailable'
  | 'busy'
  | 'activeAlerts'
  | 'respondersOnline'
  | 'resolvedRequests'
  | 'incomingRequests'
  | 'viewAlerts'
  | 'accept'
  | 'decline'
  | 'assigned'
  | 'completed'
  | 'noIncoming'
  | 'openMap'
  | 'serviceMap'
  | 'routeTitle'
  | 'eta'
  | 'distance'
  | 'currentArea'
  | 'responder'
  | 'requester'
  | 'personalInfo'
  | 'editName'
  | 'preference'
  | 'darkMode'
  | 'notifications'
  | 'language'
  | 'english'
  | 'nepali'
  | 'security'
  | 'changePassword'
  | 'logout'
  | 'saveName'
  | 'fullName'
  | 'cancel'
  | 'logoutConfirmTitle'
  | 'logoutConfirmMessage';

type DashboardEmergencyRequest = {
  id: string;
  type: string;
  requester: string;
  location: string;
  time: string;
  status: RequestStatus;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
};

const adminTabs = [
  { label: 'Overview', icon: 'grid-outline' },
  { label: 'Alerts', icon: 'warning-outline' },
  { label: 'Map', icon: 'map-outline' },
  { label: 'Settings', icon: 'settings-outline' },
] as const satisfies readonly {
  label: AdminTab;
  icon: keyof typeof Ionicons.glyphMap;
}[];

const text: Record<'en' | 'ne', Record<AdminTextKey, string>> = {
  en: {
    overview: 'Overview',
    alerts: 'Alerts',
    map: 'Map',
    settings: 'Settings',
    resolved: 'Resolved',
    welcomeBack: 'Welcome back',
    available: 'Available',
    unavailable: 'Unavailable',
    busy: 'Busy',
    activeAlerts: 'Active Alerts',
    respondersOnline: 'Responders Online',
    resolvedRequests: 'Resolved',
    incomingRequests: 'Incoming Requests',
    viewAlerts: 'View Alerts',
    accept: 'Accept',
    decline: 'Decline',
    assigned: 'Assigned',
    completed: 'Completed',
    noIncoming: 'No incoming requests right now.',
    openMap: 'Open Map',
    serviceMap: 'Service Map',
    routeTitle: 'Route to requester',
    eta: 'ETA',
    distance: 'Distance',
    currentArea: 'Current area',
    responder: 'Responder',
    requester: 'Requester',
    personalInfo: 'Personal Info',
    editName: 'Edit Name',
    preference: 'Preference',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    language: 'Language',
    english: 'English',
    nepali: 'Nepali',
    security: 'Security',
    changePassword: 'Change Password',
    logout: 'Logout',
    saveName: 'Save Name',
    fullName: 'Full name',
    cancel: 'Cancel',
    logoutConfirmTitle: 'Logout?',
    logoutConfirmMessage: 'Are you sure you want to logout?',
  },
  ne: {
    overview: 'अवलोकन',
    alerts: 'अलर्ट',
    map: 'नक्सा',
    settings: 'सेटिङ',
    resolved: 'समाधान',
    welcomeBack: 'फेरि स्वागत छ',
    available: 'उपलब्ध',
    unavailable: 'अनुपलब्ध',
    busy: 'व्यस्त',
    activeAlerts: 'सक्रिय अलर्ट',
    respondersOnline: 'अनलाइन उद्धारकर्ता',
    resolvedRequests: 'समाधान',
    incomingRequests: 'आउँदै गरेका अनुरोध',
    viewAlerts: 'अलर्ट हेर्नुहोस्',
    accept: 'स्वीकार',
    decline: 'अस्वीकार',
    assigned: 'खटाइएको',
    completed: 'सम्पन्न',
    noIncoming: 'अहिले कुनै नयाँ अनुरोध छैन।',
    openMap: 'नक्सा खोल्नुहोस्',
    serviceMap: 'सेवा नक्सा',
    routeTitle: 'अनुरोधकर्तासम्मको बाटो',
    eta: 'आगमन समय',
    distance: 'दूरी',
    currentArea: 'हालको क्षेत्र',
    responder: 'उद्धारकर्ता',
    requester: 'अनुरोधकर्ता',
    personalInfo: 'व्यक्तिगत जानकारी',
    editName: 'नाम सम्पादन',
    preference: 'प्राथमिकता',
    darkMode: 'डार्क मोड',
    notifications: 'सूचना',
    language: 'भाषा',
    english: 'अङ्ग्रेजी',
    nepali: 'नेपाली',
    security: 'सुरक्षा',
    changePassword: 'पासवर्ड परिवर्तन',
    logout: 'लगआउट',
    saveName: 'नाम सेभ',
    fullName: 'पूरा नाम',
    cancel: 'रद्द',
    logoutConfirmTitle: 'लगआउट गर्ने?',
    logoutConfirmMessage: 'के तपाईं पक्का लगआउट गर्न चाहनुहुन्छ?',
  },
};

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
};

function SettingRow({ icon, label, value, onValueChange, onPress }: SettingRowProps) {
  const { darkMode } = useAppPreferences();
  const isSwitch = typeof value === 'boolean';

  return (
    <TouchableOpacity style={styles.settingRow} activeOpacity={onPress ? 0.75 : 1} disabled={!onPress} onPress={onPress}>
      <View style={styles.settingLabelWrap}>
        <View style={styles.settingIconWrap}>
          <Ionicons name={icon} size={22} color={RED} />
        </View>
        <Text style={[styles.settingLabel, darkMode && styles.textDark]}>{label}</Text>
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: darkMode ? '#3A3A3A' : '#A0AEC0', true: RED }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <Ionicons name="chevron-forward" size={24} color={darkMode ? '#FFFFFF' : '#111827'} />
      )}
    </TouchableOpacity>
  );
}

function getServiceDetails(request: AdminEmergencyRequest) {
  const serviceType = request.serviceType || (request.emergencyType === 'medical' ? 'ambulance' : request.emergencyType);

  if (serviceType === 'police') {
    return {
      type: 'Police Help',
      icon: 'police-badge-outline' as const,
      color: RED,
    };
  }

  if (serviceType === 'fire_truck' || serviceType === 'fire') {
    return {
      type: 'Fire Rescue',
      icon: 'fire-truck' as const,
      color: '#DD6B20',
    };
  }

  return {
    type: 'Ambulance',
    icon: 'ambulance' as const,
    color: BLUE,
  };
}

function mapRequestStatus(status: string): RequestStatus {
  if (status === 'completed') {
    return 'completed';
  }

  if (status === 'approved' || status === 'assigned' || status === 'in_progress') {
    return 'assigned';
  }

  return 'incoming';
}

function formatRequestTime(value?: string) {
  if (!value) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatLocation(location?: { latitude: string; longitude: string } | null) {
  if (!location?.latitude || !location.longitude) {
    return 'Location unavailable';
  }

  return `${location.latitude}, ${location.longitude}`;
}

function toDashboardRequest(request: AdminEmergencyRequest): DashboardEmergencyRequest {
  const service = getServiceDetails(request);

  return {
    id: request.id,
    type: service.type,
    requester: request.requester?.name || `User ${request.userId.slice(0, 8)}`,
    location: formatLocation(request.coordinates || request.requester?.currentLocation),
    time: formatRequestTime(request.tracking?.requestedAt || request.timestamp),
    status: mapRequestStatus(request.requestStatus),
    icon: service.icon,
    color: service.color,
  };
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const { darkMode, language, setDarkMode, setLanguage } = useAppPreferences();
  const tr = (key: AdminTextKey) => text[language][key];
  const [activeTab, setActiveTab] = useState<AdminTab>('Overview');
  const [requests, setRequests] = useState<DashboardEmergencyRequest[]>([]);
  const [responderStatus, setResponderStatus] = useState<ResponderStatus>('available');
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savedName, setSavedName] = useState(currentUser?.name || 'Admin');
  const [draftName, setDraftName] = useState(currentUser?.name || 'Admin');
  const displayEmail = currentUser?.email || 'admin@heraldcollege.np';

  const activeRequests = requests.filter((request) => request.status !== 'completed');
  const incomingRequests = requests.filter((request) => request.status === 'incoming');
  const resolvedRequests = requests.filter((request) => request.status === 'completed');
  const assignedRequest = requests.find((request) => request.status === 'assigned');
  const respondersOnline = responderStatus === 'unavailable' ? 0 : 1;

  const currentPageTitle = activeTab === 'Resolved' ? tr('resolved') : tr(activeTab.toLowerCase() as AdminTextKey);

  const loadAdminRequests = useCallback(async (silent = false) => {
    if (responderStatus === 'unavailable') {
      setRequests([]);
      return;
    }

    try {
      setIsLoadingRequests(true);
      const [active, completed] = await Promise.all([
        getAdminEmergencyRequests('active'),
        getAdminEmergencyRequests('completed'),
      ]);
      setRequests([...active, ...completed].map(toDashboardRequest));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load emergency requests.';
      if (!silent) {
        Alert.alert('Requests unavailable', message);
      }
      setRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [responderStatus]);

  useEffect(() => {
    loadAdminRequests();
  }, [loadAdminRequests]);

  useEffect(() => {
    if (responderStatus === 'unavailable') {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadAdminRequests(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [loadAdminRequests, responderStatus]);

  const metrics = [
    {
      key: 'Alerts' as AdminTab,
      label: tr('activeAlerts'),
      value: String(incomingRequests.length).padStart(2, '0'),
      icon: 'alarm-light-outline' as const,
      color: RED,
    },
    {
      key: null,
      label: tr('respondersOnline'),
      value: `${respondersOnline}/1`,
      icon: 'account-hard-hat' as const,
      color: GREEN,
    },
    {
      key: 'Resolved' as AdminTab,
      label: tr('resolvedRequests'),
      value: String(resolvedRequests.length).padStart(2, '0'),
      icon: 'check-decagram-outline' as const,
      color: BLUE,
    },
  ];

  const setAvailability = () => {
    setResponderStatus((current) => {
      const next = current === 'available' ? 'unavailable' : 'available';

      if (next === 'unavailable') {
        setRequests([]);
      }

      return next;
    });
  };

  const handleAcceptRequest = async (id: string) => {
    if (responderStatus === 'unavailable') {
      Alert.alert(tr('unavailable'), tr('noIncoming'));
      return;
    }

    try {
      await approveAdminEmergencyRequest(id);
      await loadAdminRequests();
      setResponderStatus('busy');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to accept this request.';
      Alert.alert('Accept failed', message);
    }
  };

  const handleDeclineRequest = async (id: string) => {
    try {
      await rejectAdminEmergencyRequest(id);
      await loadAdminRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to decline this request.';
      Alert.alert('Decline failed', message);
    }
  };

  const handleCompleteRequest = async (id: string) => {
    try {
      await resolveAdminEmergencyRequest(id);
      await loadAdminRequests();
      setResponderStatus('available');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resolve this request.';
      Alert.alert('Resolve failed', message);
    }
  };

  const confirmLogout = () => {
    Alert.alert(tr('logoutConfirmTitle'), tr('logoutConfirmMessage'), [
      { text: tr('cancel'), style: 'cancel' },
      {
        text: tr('logout'),
        style: 'destructive',
        onPress: () => {
          logoutUser();
          router.replace(adminSignInRoute);
        },
      },
    ]);
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

  const renderRequestCard = (request: DashboardEmergencyRequest) => (
    <View key={request.id} style={[styles.requestCard, darkMode && styles.cardDark]}>
      <View style={[styles.requestIcon, { backgroundColor: `${request.color}18` }]}>
        <MaterialCommunityIcons name={request.icon} size={28} color={request.color} />
      </View>
      <View style={styles.requestDetails}>
        <View style={styles.requestTopRow}>
          <Text style={[styles.requestType, darkMode && styles.textDark]}>{request.type}</Text>
          <Text style={styles.requestTime}>{request.time}</Text>
        </View>
        <Text style={[styles.requester, darkMode && styles.mutedTextDark]}>{request.requester}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={MUTED} />
          <Text style={styles.locationText}>{request.location}</Text>
        </View>

        {request.status === 'assigned' ? (
          <View style={styles.requestActions}>
            <View style={styles.assignedBadge}>
              <Text style={styles.statusText}>{tr('assigned')}</Text>
            </View>
            <TouchableOpacity style={styles.completeButton} activeOpacity={0.8} onPress={() => handleCompleteRequest(request.id)}>
              <Text style={styles.completeButtonText}>{tr('completed')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.requestActions}>
            <TouchableOpacity style={styles.acceptButton} activeOpacity={0.8} onPress={() => handleAcceptRequest(request.id)}>
              <Text style={styles.actionButtonText}>{tr('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.busyButton} activeOpacity={0.8} onPress={() => handleDeclineRequest(request.id)}>
              <Text style={styles.busyButtonText}>{tr('decline')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity
          style={[
            styles.availabilityButton,
            responderStatus === 'busy' && styles.busyStatusButton,
            responderStatus === 'unavailable' && styles.unavailableStatusButton,
          ]}
          activeOpacity={0.8}
          disabled={responderStatus === 'busy'}
          onPress={setAvailability}
        >
          <View
            style={[
              styles.availabilityDot,
              responderStatus === 'busy' && styles.busyDot,
              responderStatus === 'unavailable' && styles.unavailableDot,
            ]}
          />
          <Text style={styles.availabilityText}>{tr(responderStatus)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.eyebrow}>{tr('welcomeBack')}</Text>
          <Text style={[styles.title, darkMode && styles.textDark]}>{savedName}</Text>
        </View>
      </View>
    </>
  );

  const renderOverview = () => (
    <>
      <View style={styles.alertPanel}>
        <View style={styles.alertIconWrap}>
          <MaterialCommunityIcons name="shield-alert-outline" size={30} color="#FFFFFF" />
        </View>
        <View style={styles.alertTextWrap}>
          <Text style={styles.alertTitle}>{`${incomingRequests.length} ${tr('incomingRequests')}`}</Text>
          <Text style={styles.alertSubtitle}>{assignedRequest ? tr('busy') : tr(responderStatus)}</Text>
        </View>
        <TouchableOpacity style={styles.alertPanelButton} onPress={() => setActiveTab('Alerts')}>
          <Text style={styles.alertPanelButtonText}>{tr('viewAlerts')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.metricCard, darkMode && styles.cardDark]}
            activeOpacity={item.key ? 0.78 : 1}
            onPress={() => item.key && setActiveTab(item.key)}
          >
            <View style={[styles.metricIcon, { backgroundColor: `${item.color}18` }]}>
              <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={[styles.metricValue, darkMode && styles.textDark]}>{item.value}</Text>
            <Text style={[styles.metricLabel, darkMode && styles.mutedTextDark]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{tr('incomingRequests')}</Text>
        <TouchableOpacity onPress={() => setActiveTab('Alerts')}>
          <Text style={styles.sectionAction}>{tr('viewAlerts')}</Text>
        </TouchableOpacity>
      </View>
      {isLoadingRequests ? <ActivityIndicator color={RED} /> : activeRequests.length > 0 ? activeRequests.map(renderRequestCard) : <Text style={styles.emptyText}>{tr('noIncoming')}</Text>}
    </>
  );

  const renderAlerts = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{tr('incomingRequests')}</Text>
      </View>
      {isLoadingRequests ? <ActivityIndicator color={RED} /> : activeRequests.length > 0 ? activeRequests.map(renderRequestCard) : <Text style={styles.emptyText}>{tr('noIncoming')}</Text>}
    </>
  );

  const renderResolved = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{tr('resolvedRequests')}</Text>
      </View>
      {isLoadingRequests ? <ActivityIndicator color={RED} /> : resolvedRequests.length > 0 ? resolvedRequests.map((request) => (
        <View key={request.id} style={[styles.requestCard, darkMode && styles.cardDark]}>
          <View style={[styles.requestIcon, { backgroundColor: `${GREEN}18` }]}>
            <MaterialCommunityIcons name="check-decagram-outline" size={28} color={GREEN} />
          </View>
          <View style={styles.requestDetails}>
            <Text style={[styles.requestType, darkMode && styles.textDark]}>{request.type}</Text>
            <Text style={[styles.requester, darkMode && styles.mutedTextDark]}>{request.requester}</Text>
            <Text style={styles.locationText}>{request.location}</Text>
            <View style={styles.completedBadge}>
              <Text style={styles.statusText}>{tr('completed')}</Text>
            </View>
          </View>
        </View>
      )) : <Text style={styles.emptyText}>{tr('noIncoming')}</Text>}
    </>
  );

  const renderMap = () => (
    <>
      <View style={styles.statusPanel}>
        <View style={styles.statusIconWrap}>
          <MaterialCommunityIcons name={assignedRequest?.icon || 'map-marker-path'} size={36} color="#FFFFFF" />
        </View>
        <View style={styles.statusTextWrap}>
          <Text style={styles.statusEyebrow}>{tr('serviceMap')}</Text>
          <Text style={styles.statusTitle}>{assignedRequest ? assignedRequest.requester : tr('currentArea')}</Text>
          <Text style={styles.statusSubtitle}>{assignedRequest ? assignedRequest.location : 'Kathmandu Valley response zone'}</Text>
        </View>
      </View>

      <View style={[styles.mapPanel, darkMode && styles.cardDark]}>
        <View style={styles.mapGrid}>
          <View style={styles.routeLine} />
          <View style={[styles.mapMarker, styles.userMarker]}>
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </View>
          <View style={[styles.mapMarker, styles.providerMarker]}>
            <MaterialCommunityIcons name={assignedRequest?.icon || 'ambulance'} size={19} color="#FFFFFF" />
          </View>
          <View style={styles.routeDotOne} />
          <View style={styles.routeDotTwo} />
        </View>
        <View style={styles.mapInfo}>
          <Text style={[styles.mapTitle, darkMode && styles.textDark]}>{tr('routeTitle')}</Text>
          <Text style={styles.mapText}>{assignedRequest?.location || 'Kathmandu Valley'}</Text>
        </View>
      </View>

      <View style={styles.providerGrid}>
        {[
          { label: tr('responder'), value: savedName, icon: 'account-hard-hat' as const },
          { label: tr('eta'), value: assignedRequest ? '6 min' : '--', icon: 'clock-fast' as const },
          { label: tr('distance'), value: assignedRequest ? '1.8 km' : '--', icon: 'map-marker-distance' as const },
        ].map((item) => (
          <View key={item.label} style={[styles.providerCard, darkMode && styles.cardDark]}>
            <View style={styles.providerIcon}>
              <MaterialCommunityIcons name={item.icon} size={23} color={RED} />
            </View>
            <Text style={styles.providerLabel}>{item.label}</Text>
            <Text style={[styles.providerValue, darkMode && styles.textDark]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderSettings = () => (
    <>
      <View style={[styles.settingsHero, darkMode && styles.settingsHeroDark]}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarHead} />
          <View style={styles.avatarBody} />
        </View>
        <View style={[styles.namePill, darkMode && styles.cardDark]}>
          <Text style={[styles.profileName, darkMode && styles.textDark]}>{savedName}</Text>
          <Text style={[styles.profileEmail, darkMode && styles.mutedTextDark]}>{displayEmail}</Text>
        </View>
      </View>

      <View style={[styles.settingsCard, darkMode && styles.cardDark]}>
        <Text style={[styles.settingsSectionTitle, darkMode && styles.textDark]}>{tr('personalInfo')}</Text>
        <SettingRow icon="person-outline" label={tr('editName')} onPress={() => setIsEditingName((current) => !current)} />
        {isEditingName && (
          <View style={styles.editPanel}>
            <TextInput
              style={[styles.nameInput, darkMode && styles.inputDark]}
              value={draftName}
              onChangeText={setDraftName}
              placeholder={tr('fullName')}
              placeholderTextColor={darkMode ? '#858B98' : '#A0AEC0'}
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditingName(false)}>
                <Text style={styles.cancelButtonText}>{tr('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                <Text style={styles.saveButtonText}>{tr('saveName')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.settingsSectionTitle, styles.sectionGap, darkMode && styles.textDark]}>{tr('preference')}</Text>
        <SettingRow icon="moon" label={tr('darkMode')} value={darkMode} onValueChange={setDarkMode} />
        <SettingRow icon="notifications" label={tr('notifications')} value={notifications} onValueChange={setNotifications} />

        <Text style={[styles.settingsSectionTitle, styles.sectionGap, darkMode && styles.textDark]}>{tr('language')}</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelWrap}>
            <View style={styles.settingIconWrap}>
              <MaterialCommunityIcons name="translate" size={22} color={RED} />
            </View>
            <Text style={[styles.settingLabel, darkMode && styles.textDark]}>{language === 'ne' ? tr('nepali') : tr('english')}</Text>
          </View>
          <View style={styles.languageToggle}>
            <TouchableOpacity style={[styles.languageOption, language === 'en' && styles.languageOptionActive]} onPress={() => setLanguage('en')}>
              <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>{tr('english')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.languageOption, language === 'ne' && styles.languageOptionActive]} onPress={() => setLanguage('ne')}>
              <Text style={[styles.languageText, language === 'ne' && styles.languageTextActive]}>{tr('nepali')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.settingsSectionTitle, styles.sectionGap, darkMode && styles.textDark]}>{tr('security')}</Text>
        <SettingRow icon="lock-closed-outline" label={tr('changePassword')} onPress={() => router.push(adminChangePasswordRoute)} />
      </View>

      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={confirmLogout}>
        <Text style={styles.logoutText}>{tr('logout')}</Text>
      </TouchableOpacity>
    </>
  );

  const renderContent = () => {
    if (activeTab === 'Alerts') {
      return renderAlerts();
    }

    if (activeTab === 'Map') {
      return renderMap();
    }

    if (activeTab === 'Settings') {
      return renderSettings();
    }

    if (activeTab === 'Resolved') {
      return renderResolved();
    }

    return renderOverview();
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          activeTab === 'Settings' ? styles.settingsScrollContent : styles.scrollContent,
          darkMode && styles.scrollContentDark,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab !== 'Settings' && renderHeader()}
        {activeTab !== 'Overview' && activeTab !== 'Settings' && (
          <View style={styles.pageTitleRow}>
            <Text style={[styles.pageTitle, darkMode && styles.textDark]}>{currentPageTitle}</Text>
            {activeTab === 'Resolved' && (
              <TouchableOpacity onPress={() => setActiveTab('Overview')}>
                <Text style={styles.sectionAction}>{tr('overview')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {renderContent()}
        <View style={{ height: 102 }} />
      </ScrollView>

      <View style={[styles.bottomTabBar, darkMode && styles.bottomTabBarDark]}>
        {adminTabs.map((tab) => {
          const isActive = activeTab === tab.label;

          return (
            <TouchableOpacity key={tab.label} style={styles.tabItem} onPress={() => setActiveTab(tab.label)} activeOpacity={0.8}>
              <View style={isActive ? styles.activeTabBg : styles.inactiveTabBg}>
                <Ionicons name={tab.icon} size={22} color={isActive ? RED : '#FFFFFF'} />
                <Text style={[styles.tabText, { color: isActive ? RED : '#FFFFFF' }]}>{tr(tab.label.toLowerCase() as AdminTextKey)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  settingsScrollContent: {
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 28,
  },
  scrollContentDark: {
    backgroundColor: '#050505',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  logo: {
    height: 50,
    width: 150,
  },
  availabilityButton: {
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    borderColor: '#B2F5EA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  busyStatusButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FED7D7',
  },
  unavailableStatusButton: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
  },
  availabilityDot: {
    backgroundColor: GREEN,
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  busyDot: {
    backgroundColor: RED,
  },
  unavailableDot: {
    backgroundColor: FAINT,
  },
  availabilityText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '900',
  },
  titleRow: {
    marginBottom: 18,
  },
  eyebrow: {
    color: RED,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 5,
  },
  title: {
    color: NAVY,
    fontSize: 28,
    fontWeight: '900',
  },
  pageTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    color: NAVY,
    fontSize: 24,
    fontWeight: '900',
  },
  alertPanel: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 18,
    padding: 16,
  },
  alertIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    marginRight: 14,
    width: 52,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  alertSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '700',
  },
  alertPanelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alertPanelButtonText: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 130,
    padding: 12,
    width: '31.5%',
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    marginBottom: 10,
    width: 38,
  },
  metricValue: {
    color: NAVY,
    fontSize: 25,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#2D3748',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    marginTop: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionAction: {
    color: RED,
    fontSize: 14,
    fontWeight: '900',
  },
  requestCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 14,
  },
  requestIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    width: 48,
  },
  requestDetails: {
    flex: 1,
  },
  requestTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestType: {
    color: NAVY,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    marginRight: 8,
  },
  requestTime: {
    color: FAINT,
    fontSize: 12,
    fontWeight: '700',
  },
  requester: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  locationText: {
    color: MUTED,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  requestActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 13,
  },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  busyButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: RED,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  busyButtonText: {
    color: RED,
    fontSize: 13,
    fontWeight: '900',
  },
  assignedBadge: {
    backgroundColor: BLUE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: GREEN,
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completeButton: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusPanel: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
  },
  statusIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    height: 58,
    justifyContent: 'center',
    marginRight: 13,
    width: 58,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusEyebrow: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  statusSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 5,
  },
  mapPanel: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapGrid: {
    backgroundColor: '#EEF6F7',
    height: 190,
    position: 'relative',
  },
  routeLine: {
    backgroundColor: BLUE,
    borderRadius: 3,
    height: 6,
    left: 68,
    opacity: 0.65,
    position: 'absolute',
    top: 94,
    transform: [{ rotate: '-24deg' }],
    width: 230,
  },
  mapMarker: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    width: 36,
  },
  userMarker: {
    backgroundColor: NAVY,
    bottom: 36,
    left: 42,
  },
  providerMarker: {
    backgroundColor: RED,
    right: 44,
    top: 35,
  },
  routeDotOne: {
    backgroundColor: BLUE,
    borderRadius: 6,
    height: 12,
    left: 138,
    position: 'absolute',
    top: 111,
    width: 12,
  },
  routeDotTwo: {
    backgroundColor: BLUE,
    borderRadius: 5,
    height: 10,
    position: 'absolute',
    right: 122,
    top: 73,
    width: 10,
  },
  mapInfo: {
    padding: 14,
  },
  mapTitle: {
    color: NAVY,
    fontSize: 17,
    fontWeight: '900',
  },
  mapText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  providerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 122,
    padding: 10,
    width: '31.5%',
  },
  providerIcon: {
    alignItems: 'center',
    backgroundColor: LIGHT_RED,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    marginBottom: 10,
    width: 38,
  },
  providerLabel: {
    color: FAINT,
    fontSize: 11,
    fontWeight: '900',
  },
  providerValue: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    marginTop: 4,
  },
  settingsHero: {
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    marginHorizontal: -28,
    paddingBottom: 78,
    paddingTop: 82,
  },
  settingsHeroDark: {
    backgroundColor: '#0B0B0B',
  },
  avatarOuter: {
    alignItems: 'center',
    backgroundColor: '#D8D8D8',
    borderRadius: 72,
    height: 144,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    paddingTop: 34,
    width: 144,
  },
  avatarHead: {
    backgroundColor: '#616161',
    borderRadius: 31,
    height: 62,
    width: 62,
  },
  avatarBody: {
    backgroundColor: '#616161',
    borderTopLeftRadius: 72,
    borderTopRightRadius: 72,
    height: 78,
    marginTop: 24,
    width: 126,
  },
  namePill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    bottom: 50,
    minWidth: 210,
    paddingHorizontal: 24,
    paddingVertical: 13,
    position: 'absolute',
  },
  profileName: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
  },
  profileEmail: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: -42,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  settingsSectionTitle: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 18,
  },
  sectionGap: {
    marginTop: 34,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  settingLabelWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  settingIconWrap: {
    alignItems: 'center',
    backgroundColor: LIGHT_RED,
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    marginRight: 14,
    width: 42,
  },
  settingLabel: {
    color: '#111827',
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  editPanel: {
    marginBottom: 6,
    marginTop: 8,
  },
  nameInput: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 10,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  inputDark: {
    backgroundColor: '#080808',
    borderColor: '#2B2B2B',
    color: '#FFFFFF',
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
    color: MUTED,
    fontSize: 13,
    fontWeight: '800',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  languageToggle: {
    backgroundColor: '#F4F6FA',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 4,
  },
  languageOption: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  languageOptionActive: {
    backgroundColor: RED,
  },
  languageText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '900',
  },
  languageTextActive: {
    color: '#FFFFFF',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    marginTop: 42,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  cardDark: {
    backgroundColor: '#121212',
    borderColor: '#2A2A2A',
  },
  textDark: {
    color: '#F9FAFB',
  },
  mutedTextDark: {
    color: '#CBD5E1',
  },
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
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inactiveTabBg: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
});
