import { AppBottomNav } from '@/components/app-bottom-nav';
import { useAppPreferences } from '@/src/lib/app-preferences';
import { createEmergencyRequest } from '@/src/lib/auth';
import { getCurrentEmergencyLocation } from '@/src/lib/location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ServiceType = 'ambulance' | 'police' | 'fire_truck';

const RED = '#E63946';
const NAVY = '#1A365D';
const BORDER = '#E2E8F0';
const MUTED = '#718096';
const SURFACE = '#F7FAFC';
const dashboardRoute = '/dashboard' as Href;
const trackRequestRoute = '/track-request' as Href;

const serviceConfig: Record<ServiceType, { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; helper: string }> = {
  ambulance: {
    title: 'Ambulance',
    icon: 'ambulance',
    color: '#3182CE',
    helper: 'For medical emergencies, injuries, and urgent transport.',
  },
  police: {
    title: 'Police Help',
    icon: 'police-badge',
    color: '#E63946',
    helper: 'For safety threats, violence, crime, or immediate police support.',
  },
  fire_truck: {
    title: 'Fire Rescue',
    icon: 'fire-truck',
    color: '#DD6B20',
    helper: 'For fire, smoke, gas leak, or trapped-person emergencies.',
  },
};

function normalizeServiceType(value?: string): ServiceType {
  if (value === 'police' || value === 'fire_truck') {
    return value;
  }

  return 'ambulance';
}

export default function ServiceRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceType?: string; serviceLabel?: string }>();
  const { darkMode } = useAppPreferences();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const serviceType = normalizeServiceType(params.serviceType);
  const service = useMemo(() => serviceConfig[serviceType], [serviceType]);
  const title = params.serviceLabel || service.title;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const location = await getCurrentEmergencyLocation();

      await createEmergencyRequest({
        emergencyType: serviceType,
        emergencyDescription: description.trim() || `${title} emergency request.`,
        userLocation: location,
      });

      Alert.alert('Request sent', `Your location has been shared with ${title}.`, [
        { text: 'Track request', onPress: () => router.replace(trackRequestRoute) },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send this request right now.';
      Alert.alert('Request failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={[styles.backButton, darkMode && styles.cardDark]} onPress={() => router.replace(dashboardRoute)}>
              <Ionicons name="chevron-back" size={22} color={darkMode ? '#FFFFFF' : NAVY} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, darkMode && styles.textDark]}>{title}</Text>
          </View>

          <View style={[styles.heroCard, darkMode && styles.cardDark]}>
            <View style={[styles.serviceIcon, { backgroundColor: `${service.color}18` }]}>
              <MaterialCommunityIcons name={service.icon} size={42} color={service.color} />
            </View>
            <Text style={[styles.title, darkMode && styles.textDark]}>{title}</Text>
            <Text style={styles.helper}>{service.helper}</Text>
          </View>

          <View style={[styles.formCard, darkMode && styles.cardDark]}>
            <Text style={[styles.label, darkMode && styles.textDark]}>What happened?</Text>
            <TextInput
              style={[styles.descriptionInput, darkMode && styles.inputDark]}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              placeholder="Add details that can help responders"
              placeholderTextColor={darkMode ? '#9CA3AF' : '#A0AEC0'}
            />

            <View style={styles.locationNotice}>
              <Ionicons name="location" size={18} color={RED} />
              <Text style={styles.locationText}>Your current location will be shared after permission is granted.</Text>
            </View>

            <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.submitText}>Request Help</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 96 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <AppBottomNav activeTab="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: SURFACE, flex: 1 },
  containerDark: { backgroundColor: '#050505' },
  keyboard: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 16 },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerTitle: { color: NAVY, flex: 1, fontSize: 22, fontWeight: '900' },
  heroCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: BORDER, borderRadius: 8, borderWidth: 1, marginBottom: 16, padding: 20 },
  serviceIcon: { alignItems: 'center', borderRadius: 8, height: 72, justifyContent: 'center', marginBottom: 14, width: 72 },
  title: { color: NAVY, fontSize: 26, fontWeight: '900' },
  helper: { color: MUTED, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  formCard: { backgroundColor: '#FFFFFF', borderColor: BORDER, borderRadius: 8, borderWidth: 1, padding: 16 },
  label: { color: '#111827', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  descriptionInput: { backgroundColor: SURFACE, borderColor: BORDER, borderRadius: 8, borderWidth: 1, color: '#111827', fontSize: 15, minHeight: 130, padding: 12 },
  inputDark: { backgroundColor: '#050505', borderColor: '#2A2A2A', color: '#F9FAFB' },
  locationNotice: { alignItems: 'center', backgroundColor: '#FFF1F2', borderRadius: 8, flexDirection: 'row', gap: 8, marginTop: 14, padding: 12 },
  locationText: { color: '#4B5563', flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  submitButton: { alignItems: 'center', backgroundColor: RED, borderRadius: 8, flexDirection: 'row', gap: 8, height: 52, justifyContent: 'center', marginTop: 16 },
  buttonDisabled: { opacity: 0.7 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  cardDark: { backgroundColor: '#121212', borderColor: '#2A2A2A' },
  textDark: { color: '#F9FAFB' },
});
