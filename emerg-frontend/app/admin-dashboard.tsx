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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createServiceProviderCredentials } from '@/src/lib/auth';

const RED = '#E63946';
const NAVY = '#1A365D';
const MUTED = '#718096';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';

const metrics = [
  {
    label: 'Active Alerts',
    value: '12',
    icon: 'alarm-light-outline',
    color: RED,
    trend: '+3 today',
  },
  {
    label: 'Responders Online',
    value: '48',
    icon: 'account-hard-hat',
    color: '#00A86B',
    trend: '8 nearby',
  },
  {
    label: 'Pending Dispatch',
    value: '07',
    icon: 'clock-alert-outline',
    color: '#ECC94B',
    trend: '2 critical',
  },
  {
    label: 'Resolved',
    value: '31',
    icon: 'check-decagram-outline',
    color: '#3182CE',
    trend: 'last 24h',
  },
] as const;

const incidents = [
  {
    type: 'Ambulance',
    requester: 'Maya Gurung',
    location: 'Lakeside Road, Pokhara',
    time: '2 min ago',
    status: 'Critical',
    color: RED,
    icon: 'ambulance',
  },
  {
    type: 'Fire Rescue',
    requester: 'Niraj Shrestha',
    location: 'New Baneshwor, Kathmandu',
    time: '9 min ago',
    status: 'Dispatching',
    color: '#ECC94B',
    icon: 'fire-truck',
  },
  {
    type: 'Police Help',
    requester: 'Asha Thapa',
    location: 'Itahari Main Chowk',
    time: '18 min ago',
    status: 'Assigned',
    color: '#3182CE',
    icon: 'police-badge-outline',
  },
] as const;

const responders = [
  { name: 'Ambulance A-04', area: 'North Zone', status: 'Available' },
  { name: 'Police Unit P-11', area: 'Central Zone', status: 'On route' },
  { name: 'Fire Team F-02', area: 'East Zone', status: 'Available' },
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

const adminTabs = [
  { label: 'Overview', icon: 'grid-outline' },
  { label: 'Alerts', icon: 'warning-outline' },
  { label: 'Teams', icon: 'people-outline' },
  { label: 'Settings', icon: 'settings-outline' },
] as const satisfies readonly {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[];

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState('Overview');
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
      Alert.alert('Missing fields', 'Please fill in all service provider credential fields.');
      return;
    }

    const numericAge = Number(providerAge);

    if (!Number.isInteger(numericAge) || numericAge <= 0) {
      Alert.alert('Invalid age', 'Please enter a valid age for the service provider.');
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

      Alert.alert('Credentials created', 'Service provider credentials are ready to share.');
      resetProviderForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create service provider credentials right now.';
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

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>Admin Command Center</Text>
            <Text style={styles.title}>Emergency Overview</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        <View style={styles.alertPanel}>
          <View style={styles.alertIconWrap}>
            <MaterialCommunityIcons name="shield-alert-outline" size={30} color="#FFFFFF" />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>12 incidents need admin attention</Text>
            <Text style={styles.alertSubtitle}>Review incoming requests, assign responders, and monitor response progress.</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.map((item) => (
            <View key={item.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${item.color}18` }]}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={[styles.metricTrend, { color: item.color }]}>{item.trend}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Incoming Requests</Text>
          <TouchableOpacity activeOpacity={0.75}>
            <Text style={styles.sectionAction}>View all</Text>
          </TouchableOpacity>
        </View>

        {incidents.map((incident) => (
          <View key={`${incident.type}-${incident.requester}`} style={styles.incidentCard}>
            <View style={[styles.incidentIcon, { backgroundColor: `${incident.color}18` }]}>
              <MaterialCommunityIcons name={incident.icon} size={28} color={incident.color} />
            </View>
            <View style={styles.incidentDetails}>
              <View style={styles.incidentTopRow}>
                <Text style={styles.incidentType}>{incident.type}</Text>
                <Text style={styles.incidentTime}>{incident.time}</Text>
              </View>
              <Text style={styles.requester}>{incident.requester}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={MUTED} />
                <Text style={styles.locationText}>{incident.location}</Text>
              </View>
              <View style={styles.incidentActions}>
                <View style={[styles.statusBadge, { backgroundColor: incident.color }]}>
                  <Text style={styles.statusText}>{incident.status}</Text>
                </View>
                <TouchableOpacity style={styles.assignButton} activeOpacity={0.75}>
                  <Text style={styles.assignButtonText}>Assign</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Responder Status</Text>
          <TouchableOpacity activeOpacity={0.75}>
            <Text style={styles.sectionAction}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.responderList}>
          {responders.map((responder) => (
            <View key={responder.name} style={styles.responderRow}>
              <View style={styles.responderAvatar}>
                <MaterialCommunityIcons name="radio-handheld" size={22} color={RED} />
              </View>
              <View style={styles.responderText}>
                <Text style={styles.responderName}>{responder.name}</Text>
                <Text style={styles.responderArea}>{responder.area}</Text>
              </View>
              <Text style={[styles.responderStatus, responder.status === 'Available' ? styles.available : styles.onRoute]}>
                {responder.status}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Create Provider</Text>
        </View>

        <View style={styles.providerPanel}>
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
            style={styles.providerInput}
            placeholder="Full name"
            value={providerName}
            onChangeText={setProviderName}
            placeholderTextColor="#A0AEC0"
          />
          <TextInput
            style={styles.providerInput}
            placeholder="Age"
            keyboardType="numeric"
            value={providerAge}
            onChangeText={setProviderAge}
            placeholderTextColor="#A0AEC0"
          />
          <TextInput
            style={styles.providerInput}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={providerEmail}
            onChangeText={setProviderEmail}
            placeholderTextColor="#A0AEC0"
          />
          <TextInput
            style={styles.providerInput}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={providerPhone}
            onChangeText={setProviderPhone}
            placeholderTextColor="#A0AEC0"
          />
          <TextInput
            style={styles.providerInput}
            placeholder="Primary address"
            value={providerAddress}
            onChangeText={setProviderAddress}
            placeholderTextColor="#A0AEC0"
          />
          <TextInput
            style={styles.providerInput}
            placeholder="Organization ID"
            autoCapitalize="none"
            value={organizationId}
            onChangeText={setOrganizationId}
            placeholderTextColor="#A0AEC0"
          />
          <TextInput
            style={styles.providerInput}
            placeholder="Temporary password"
            secureTextEntry
            value={providerPassword}
            onChangeText={setProviderPassword}
            placeholderTextColor="#A0AEC0"
          />

          <TouchableOpacity
            style={[styles.createProviderButton, isCreatingProvider && styles.createProviderButtonDisabled]}
            activeOpacity={0.8}
            disabled={isCreatingProvider}
            onPress={handleCreateProvider}
          >
            {isCreatingProvider ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createProviderButtonText}>Create Credentials</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 92 }} />
      </ScrollView>

      <View style={styles.bottomTabBar}>
        {adminTabs.map((tab) => {
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
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
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
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrow: {
    color: RED,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  title: {
    color: NAVY,
    fontSize: 26,
    fontWeight: '700',
  },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    borderRadius: 8,
    flexDirection: 'row',
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: {
    backgroundColor: '#00A86B',
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  liveText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
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
    fontWeight: '700',
    marginBottom: 4,
  },
  alertSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 146,
    padding: 14,
    width: '48%',
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    marginBottom: 12,
    width: 42,
  },
  metricValue: {
    color: NAVY,
    fontSize: 28,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#2D3748',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  metricTrend: {
    fontSize: 12,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  sectionAction: {
    color: RED,
    fontSize: 14,
    fontWeight: '700',
  },
  incidentCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 14,
  },
  incidentIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    width: 48,
  },
  incidentDetails: {
    flex: 1,
  },
  incidentTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incidentType: {
    color: NAVY,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  },
  incidentTime: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
  },
  requester: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '600',
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
    marginLeft: 4,
  },
  incidentActions: {
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
    fontWeight: '700',
  },
  assignButton: {
    backgroundColor: NAVY,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  responderList: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
  },
  responderRow: {
    alignItems: 'center',
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  responderAvatar: {
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  responderText: {
    flex: 1,
  },
  responderName: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '700',
  },
  responderArea: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },
  responderStatus: {
    fontSize: 12,
    fontWeight: '800',
  },
  available: {
    color: '#00A86B',
  },
  onRoute: {
    color: '#3182CE',
  },
  providerPanel: {
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
    fontWeight: '700',
    marginLeft: 6,
  },
  providerTypeTextActive: {
    color: '#FFFFFF',
  },
  providerInput: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    color: '#1A202C',
    fontSize: 15,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  createProviderButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    marginTop: 4,
  },
  createProviderButtonDisabled: {
    opacity: 0.7,
  },
  createProviderButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
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
    fontWeight: '600',
    marginTop: 4,
  },
});
