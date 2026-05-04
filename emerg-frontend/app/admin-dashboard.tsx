import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createServiceProviderCredentials } from '@/src/lib/auth';

const RED = '#E63946';
const NAVY = '#1A365D';
const GREEN = '#00A86B';
const BLUE = '#3182CE';
const YELLOW = '#ECC94B';
const TEXT = '#1A202C';
const MUTED = '#718096';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';

const providerStats = [
  {
    label: 'Assigned',
    value: '04',
    icon: 'clipboard-pulse-outline',
    color: RED,
    detail: '2 urgent',
  },
  {
    label: 'Available',
    value: '18',
    icon: 'account-check-outline',
    color: GREEN,
    detail: 'nearby teams',
  },
  {
    label: 'On Route',
    value: '07',
    icon: 'map-marker-path',
    color: BLUE,
    detail: 'tracking live',
  },
  {
    label: 'Resolved',
    value: '31',
    icon: 'check-decagram-outline',
    color: YELLOW,
    detail: 'today',
  },
] as const;

const activeRequests = [
  {
    service: 'Ambulance',
    patient: 'Maya Gurung',
    location: 'Lakeside Road, Pokhara',
    eta: '6 min',
    status: 'Assigned',
    icon: 'ambulance',
    color: RED,
  },
  {
    service: 'Fire Response',
    patient: 'Niraj Shrestha',
    location: 'New Baneshwor, Kathmandu',
    eta: '11 min',
    status: 'On route',
    icon: 'fire-truck',
    color: YELLOW,
  },
  {
    service: 'Police Support',
    patient: 'Asha Thapa',
    location: 'Itahari Main Chowk',
    eta: 'Ready',
    status: 'Available',
    icon: 'police-badge-outline',
    color: BLUE,
  },
] as const;

const teamUnits = [
  { name: 'Ambulance A-04', area: 'North Zone', status: 'Available', color: GREEN },
  { name: 'Police Unit P-11', area: 'Central Zone', status: 'On route', color: BLUE },
  { name: 'Fire Team F-02', area: 'East Zone', status: 'Available', color: GREEN },
] as const;

const serviceTypes = [
  { label: 'Ambulance', value: 'ambulance', icon: 'ambulance' },
  { label: 'Police', value: 'police', icon: 'police-badge-outline' },
  { label: 'Rescue', value: 'rescue_team', icon: 'account-hard-hat' },
  { label: 'Fire', value: 'fire_truck', icon: 'fire-truck' },
] as const satisfies readonly {
  label: string;
  value: 'ambulance' | 'police' | 'rescue_team' | 'fire_truck';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[];

const providerTabs = [
  { label: 'Home', icon: 'home-outline' },
  { label: 'Requests', icon: 'navigate-outline' },
  { label: 'Team', icon: 'people-outline' },
  { label: 'Profile', icon: 'person-outline' },
] as const satisfies readonly {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[];

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState('Home');
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [providerName, setProviderName] = useState('');
  const [providerAge, setProviderAge] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [providerAddress, setProviderAddress] = useState('');
  const [providerPassword, setProviderPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [serviceType, setServiceType] = useState<(typeof serviceTypes)[number]['value']>('ambulance');
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);

  const resetProviderForm = () => {
    setProviderName('');
    setProviderAge('');
    setProviderEmail('');
    setProviderPhone('');
    setProviderAddress('');
    setProviderPassword('');
    setOrganizationId('');
    setServiceType('ambulance');
  };

  const handleCreateProvider = async () => {
    if (
      !providerName.trim() ||
      !providerAge.trim() ||
      !providerEmail.trim() ||
      !providerPhone.trim() ||
      !providerAddress.trim() ||
      !providerPassword.trim() ||
      !organizationId.trim()
    ) {
      Alert.alert('Missing fields', 'Please fill in all responder access fields.');
      return;
    }

    const numericAge = Number(providerAge);

    if (!Number.isInteger(numericAge) || numericAge <= 0) {
      Alert.alert('Invalid age', 'Please enter a valid age.');
      return;
    }

    try {
      setIsCreatingProvider(true);
      await createServiceProviderCredentials({
        name: providerName.trim(),
        age: numericAge,
        email: providerEmail.trim(),
        phoneNumber: providerPhone.trim(),
        primaryAddress: providerAddress.trim(),
        password: providerPassword,
        serviceType,
        organizationId: organizationId.trim(),
      });

      Alert.alert('Access created', 'Responder access is ready to share.');
      resetProviderForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create responder access right now.';
      Alert.alert('Create failed', message);
    } finally {
      setIsCreatingProvider(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
            <Ionicons name="notifications-outline" size={22} color={NAVY} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeRow}>
          <View style={styles.welcomeTextWrap}>
            <Text style={styles.welcomeText}>
              Welcome, <Text style={styles.userName}>Provider</Text>
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color={MUTED} />
              <Text style={styles.locationText}>Kathmandu Valley response area</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => setIsOnDuty((current) => !current)}
            style={[styles.dutyToggle, !isOnDuty && styles.dutyToggleOff]}
          >
            <View style={[styles.dutyDot, !isOnDuty && styles.dutyDotOff]} />
            <Text style={[styles.dutyText, !isOnDuty && styles.dutyTextOff]}>{isOnDuty ? 'On Duty' : 'Off Duty'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dispatchPanel}>
          <View style={styles.dispatchIconWrap}>
            <MaterialCommunityIcons name="radio-handheld" size={34} color="#FFFFFF" />
          </View>
          <View style={styles.dispatchTextWrap}>
            <Text style={styles.dispatchTitle}>Response desk is active</Text>
            <Text style={styles.dispatchSubtitle}>Track assigned requests, update availability, and manage responder access from one provider workspace.</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {providerStats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${item.color}18` }]}>
                <MaterialCommunityIcons name={item.icon} size={23} color={item.color} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={[styles.statDetail, { color: item.color }]}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Requests</Text>
          <TouchableOpacity activeOpacity={0.75}>
            <Text style={styles.sectionAction}>View all</Text>
          </TouchableOpacity>
        </View>

        {activeRequests.map((request) => (
          <View key={`${request.service}-${request.patient}`} style={styles.requestCard}>
            <View style={[styles.requestIcon, { backgroundColor: `${request.color}18` }]}>
              <MaterialCommunityIcons name={request.icon} size={28} color={request.color} />
            </View>
            <View style={styles.requestDetails}>
              <View style={styles.requestTopRow}>
                <Text style={styles.requestType}>{request.service}</Text>
                <Text style={styles.requestEta}>{request.eta}</Text>
              </View>
              <Text style={styles.patientName}>{request.patient}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={MUTED} />
                <Text style={styles.locationText}>{request.location}</Text>
              </View>
              <View style={styles.requestActions}>
                <View style={[styles.statusBadge, { backgroundColor: request.color }]}>
                  <Text style={styles.statusText}>{request.status}</Text>
                </View>
                <TouchableOpacity style={styles.primarySmallButton} activeOpacity={0.78}>
                  <Text style={styles.primarySmallButtonText}>Open</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Team Status</Text>
          <TouchableOpacity activeOpacity={0.75}>
            <Text style={styles.sectionAction}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.teamList}>
          {teamUnits.map((unit) => (
            <View key={unit.name} style={styles.teamRow}>
              <View style={styles.teamAvatar}>
                <MaterialCommunityIcons name="radio-handheld" size={22} color={RED} />
              </View>
              <View style={styles.teamText}>
                <Text style={styles.teamName}>{unit.name}</Text>
                <Text style={styles.teamArea}>{unit.area}</Text>
              </View>
              <Text style={[styles.teamStatus, { color: unit.color }]}>{unit.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Add Responder Access</Text>
        </View>

        <View style={styles.accessPanel}>
          <View style={styles.providerTypeGrid}>
            {serviceTypes.map((type) => {
              const isSelected = serviceType === type.value;

              return (
                <TouchableOpacity
                  key={type.value}
                  activeOpacity={0.78}
                  style={[styles.providerTypeButton, isSelected && styles.providerTypeButtonActive]}
                  onPress={() => setServiceType(type.value)}
                >
                  <MaterialCommunityIcons name={type.icon} size={21} color={isSelected ? '#FFFFFF' : NAVY} />
                  <Text style={[styles.providerTypeText, isSelected && styles.providerTypeTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.accessInput}
            placeholder="Full name"
            value={providerName}
            onChangeText={setProviderName}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.accessInput}
            placeholder="Age"
            keyboardType="numeric"
            value={providerAge}
            onChangeText={setProviderAge}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.accessInput}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={providerEmail}
            onChangeText={setProviderEmail}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.accessInput}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={providerPhone}
            onChangeText={setProviderPhone}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.accessInput}
            placeholder="Primary address"
            value={providerAddress}
            onChangeText={setProviderAddress}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.accessInput}
            placeholder="Organization ID"
            autoCapitalize="none"
            value={organizationId}
            onChangeText={setOrganizationId}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.accessInput}
            placeholder="Temporary password"
            secureTextEntry
            value={providerPassword}
            onChangeText={setProviderPassword}
            placeholderTextColor={FAINT}
          />

          <TouchableOpacity
            style={[styles.createAccessButton, isCreatingProvider && styles.createAccessButtonDisabled]}
            activeOpacity={0.8}
            disabled={isCreatingProvider}
            onPress={handleCreateProvider}
          >
            {isCreatingProvider ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                <Text style={styles.createAccessButtonText}>Create Access</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 92 }} />
      </ScrollView>

      <View style={styles.bottomTabBar}>
        {providerTabs.map((tab) => {
          const isActive = activeTab === tab.label;

          return (
            <TouchableOpacity key={tab.label} style={styles.tabItem} onPress={() => setActiveTab(tab.label)} activeOpacity={0.8}>
              <View style={isActive ? styles.activeTabBg : styles.inactiveTabBg}>
                <Ionicons name={tab.icon} size={22} color={isActive ? RED : '#FFFFFF'} />
                <Text style={[styles.tabText, { color: isActive ? RED : '#FFFFFF' }]}>{tab.label}</Text>
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
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    height: 50,
    width: 150,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  notificationDot: {
    backgroundColor: RED,
    borderColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 10,
    top: 9,
    width: 10,
  },
  welcomeRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  welcomeTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  welcomeText: {
    color: NAVY,
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 7,
  },
  userName: {
    color: RED,
    fontWeight: '700',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  locationText: {
    color: MUTED,
    flex: 1,
    fontSize: 13,
    marginLeft: 4,
  },
  dutyToggle: {
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    borderColor: '#B2F5EA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dutyToggleOff: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
  },
  dutyDot: {
    backgroundColor: GREEN,
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  dutyDotOff: {
    backgroundColor: FAINT,
  },
  dutyText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '800',
  },
  dutyTextOff: {
    color: MUTED,
  },
  dispatchPanel: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 18,
    padding: 16,
  },
  dispatchIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    height: 54,
    justifyContent: 'center',
    marginRight: 14,
    width: 54,
  },
  dispatchTextWrap: {
    flex: 1,
  },
  dispatchTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  dispatchSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 146,
    padding: 14,
    width: '48%',
  },
  statIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    marginBottom: 12,
    width: 42,
  },
  statValue: {
    color: NAVY,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statDetail: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionAction: {
    color: RED,
    fontSize: 14,
    fontWeight: '800',
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
  requestEta: {
    color: FAINT,
    fontSize: 12,
    fontWeight: '800',
  },
  patientName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  requestActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  primarySmallButton: {
    backgroundColor: NAVY,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  primarySmallButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  teamList: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  teamRow: {
    alignItems: 'center',
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  teamAvatar: {
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  teamText: {
    flex: 1,
  },
  teamName: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '800',
  },
  teamArea: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },
  teamStatus: {
    fontSize: 12,
    fontWeight: '900',
  },
  accessPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  providerTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  providerTypeButton: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
    width: '48%',
  },
  providerTypeButtonActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  providerTypeText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  providerTypeTextActive: {
    color: '#FFFFFF',
  },
  accessInput: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    color: TEXT,
    fontSize: 15,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  createAccessButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    marginTop: 4,
  },
  createAccessButtonDisabled: {
    opacity: 0.7,
  },
  createAccessButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 8,
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
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBg: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inactiveTabBg: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
});
