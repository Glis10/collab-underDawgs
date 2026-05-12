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
const TEXT = '#1A202C';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';

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

export default function AdminDashboardScreen() {
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
      Alert.alert('Missing fields', 'Please fill in all fields.');
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

      Alert.alert('Created', 'Service provider access has been created.');
      resetProviderForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create access right now.';
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
          <Text style={styles.title}>Admin</Text>
        </View>

        <Text style={styles.sectionTitle}>Create Service Provider</Text>

        <View style={styles.typeGrid}>
          {serviceTypes.map((type) => {
            const isSelected = serviceType === type.value;

            return (
              <TouchableOpacity
                key={type.value}
                activeOpacity={0.78}
                style={[styles.typeButton, isSelected && styles.typeButtonActive]}
                onPress={() => setServiceType(type.value)}
              >
                <MaterialCommunityIcons name={type.icon} size={20} color={isSelected ? '#FFFFFF' : NAVY} />
                <Text style={[styles.typeText, isSelected && styles.typeTextActive]}>{type.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={providerName}
            onChangeText={setProviderName}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.input}
            placeholder="Age"
            keyboardType="numeric"
            value={providerAge}
            onChangeText={setProviderAge}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={providerEmail}
            onChangeText={setProviderEmail}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={providerPhone}
            onChangeText={setProviderPhone}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.input}
            placeholder="Primary address"
            value={providerAddress}
            onChangeText={setProviderAddress}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.input}
            placeholder="Organization ID"
            autoCapitalize="none"
            value={organizationId}
            onChangeText={setOrganizationId}
            placeholderTextColor={FAINT}
          />
          <TextInput
            style={styles.input}
            placeholder="Temporary password"
            secureTextEntry
            value={providerPassword}
            onChangeText={setProviderPassword}
            placeholderTextColor={FAINT}
          />

          <TouchableOpacity
            style={[styles.createButton, isCreatingProvider && styles.createButtonDisabled]}
            activeOpacity={0.8}
            disabled={isCreatingProvider}
            onPress={handleCreateProvider}
          >
            {isCreatingProvider ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={19} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Access</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    height: 48,
    width: 150,
  },
  title: {
    color: NAVY,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 10,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeButton: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    height: 46,
    justifyContent: 'center',
    marginBottom: 10,
    width: '48%',
  },
  typeButtonActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  typeText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  form: {
    marginTop: 2,
  },
  input: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    color: TEXT,
    fontSize: 15,
    marginBottom: 11,
    minHeight: 50,
    paddingHorizontal: 13,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    marginTop: 5,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 8,
  },
});
