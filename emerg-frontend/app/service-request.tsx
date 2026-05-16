import { useAppPreferences } from '@/src/lib/app-preferences';
import { createEmergencyRequest, EmergencyLocation } from '@/src/lib/auth';
import { getCurrentEmergencyLocation } from '@/src/lib/location';
import { LeafletMap } from '@/src/components/leaflet-map';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  KeyboardAvoidingView,
  Modal,
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
const trackRoute = '/track-request' as Href;
const fallbackManualLocation = { latitude: '27.7112', longitude: '85.3388' };

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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [locationMode, setLocationMode] = useState<'auto' | 'manual'>('auto');
  const [manualLocation, setManualLocation] = useState<EmergencyLocation | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const serviceType = normalizeServiceType(params.serviceType);
  const service = useMemo(() => serviceConfig[serviceType], [serviceType]);
  const title = params.serviceLabel || service.title;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const location = locationMode === 'auto' ? await getCurrentEmergencyLocation() : getManualLocation(manualLocation);

      await createEmergencyRequest({
        emergencyType: serviceType,
        emergencyDescription: description.trim() || `${title} emergency request.`,
        userLocation: location,
      });

      setIsSubmitted(true);
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
            {isSubmitted ? (
              <View style={styles.submittedPanel}>
                <View style={styles.submittedIcon}>
                  <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                </View>
                <Text style={[styles.submittedTitle, darkMode && styles.textDark]}>Request shared</Text>
                <Text style={styles.submittedText}>
                  Your message and live GPS point were sent to admins. You can keep this screen open or return home while the request waits for acceptance.
                </Text>
                <View style={styles.waitingRow}>
                  <ActivityIndicator color={RED} />
                  <Text style={styles.waitingText}>Waiting for an admin to accept</Text>
                </View>
                <TouchableOpacity style={styles.submitButton} onPress={() => router.replace(trackRoute)}>
                  <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.submitText}>Track Request</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
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
                  <Ionicons name={locationMode === 'auto' ? 'locate' : 'pin'} size={18} color={RED} />
                  <Text style={styles.locationText}>
                    {locationMode === 'auto'
                      ? 'High-accuracy GPS will be shared with admins after permission is granted.'
                      : 'Enter the exact spot where help should arrive.'}
                  </Text>
                </View>

                <View style={styles.locationModeRow}>
                  <TouchableOpacity
                    style={[styles.locationModeButton, locationMode === 'auto' && styles.locationModeButtonActive]}
                    activeOpacity={0.8}
                    onPress={() => setLocationMode('auto')}
                  >
                    <Ionicons name="navigate-circle-outline" size={18} color={locationMode === 'auto' ? '#FFFFFF' : RED} />
                    <Text style={[styles.locationModeText, locationMode === 'auto' && styles.locationModeTextActive]}>Auto GPS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.locationModeButton, locationMode === 'manual' && styles.locationModeButtonActive]}
                    activeOpacity={0.8}
                    onPress={() => setLocationMode('manual')}
                  >
                    <Ionicons name="map-outline" size={18} color={locationMode === 'manual' ? '#FFFFFF' : RED} />
                    <Text style={[styles.locationModeText, locationMode === 'manual' && styles.locationModeTextActive]}>Manual</Text>
                  </TouchableOpacity>
                </View>

                {locationMode === 'manual' && (
                  <View style={[styles.manualPickerPanel, darkMode && styles.inputDark]}>
                    <View style={styles.manualPickerTextWrap}>
                      <Text style={[styles.manualPickerTitle, darkMode && styles.textDark]}>
                        {manualLocation ? 'Pinned location' : 'No location pinned'}
                      </Text>
                      <Text style={styles.manualPickerSubtitle}>
                        {manualLocation ? `${manualLocation.latitude}, ${manualLocation.longitude}` : 'Open the map and tap the exact pickup point.'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.mapPickerButton} activeOpacity={0.8} onPress={() => setIsMapPickerOpen(true)}>
                      <Ionicons name="map" size={17} color="#FFFFFF" />
                      <Text style={styles.mapPickerButtonText}>{manualLocation ? 'Change' : 'Choose'}</Text>
                    </TouchableOpacity>
                  </View>
                )}

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
              </>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isMapPickerOpen} animationType="slide" transparent onRequestClose={() => setIsMapPickerOpen(false)}>
        <View style={styles.mapPickerOverlay}>
          <View style={[styles.mapPickerSheet, darkMode && styles.cardDark]}>
            <View style={styles.mapPickerHeader}>
              <View>
                <Text style={[styles.mapPickerTitle, darkMode && styles.textDark]}>Choose location</Text>
                <Text style={styles.mapPickerHelp}>Tap the map to pin where responders should arrive.</Text>
              </View>
              <TouchableOpacity style={[styles.mapPickerClose, darkMode && styles.inputDark]} onPress={() => setIsMapPickerOpen(false)}>
                <Ionicons name="close" size={22} color={darkMode ? '#FFFFFF' : NAVY} />
              </TouchableOpacity>
            </View>

            <View style={styles.mapPickerCanvas}>
              <LeafletMap
                userLocation={manualLocation || fallbackManualLocation}
                selectedLocation={manualLocation}
                userLabel="Map center"
                height={360}
                zoomEnabled
                onLocationSelect={setManualLocation}
                fallback={
                  <FallbackMapPicker selectedLocation={manualLocation} onSelect={setManualLocation} />
                }
              />
              <View pointerEvents="none" style={styles.mapPickerHint}>
                <Ionicons name="hand-left-outline" size={15} color={NAVY} />
                <Text style={styles.mapPickerHintText}>Tap map to drop pin</Text>
              </View>
            </View>

            <View style={styles.mapPickerFooter}>
              <Text style={styles.mapPickerCoordinates}>
                {manualLocation ? `${manualLocation.latitude}, ${manualLocation.longitude}` : 'Tap once to select a location'}
              </Text>
              <TouchableOpacity
                style={[styles.submitButton, !manualLocation && styles.buttonDisabled]}
                disabled={!manualLocation}
                onPress={() => setIsMapPickerOpen(false)}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Use Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FallbackMapPicker({
  selectedLocation,
  onSelect,
}: {
  selectedLocation: EmergencyLocation | null;
  onSelect: (location: EmergencyLocation) => void;
}) {
  const handlePress = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const width = 320;
    const height = 360;
    const latitude = Number(fallbackManualLocation.latitude) + (0.5 - locationY / height) * 0.08;
    const longitude = Number(fallbackManualLocation.longitude) + (locationX / width - 0.5) * 0.08;

    onSelect({
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    });
  };

  return (
    <TouchableOpacity style={styles.mapPickerFallback} activeOpacity={0.9} onPress={handlePress}>
      <View style={styles.fallbackRoadOne} />
      <View style={styles.fallbackRoadTwo} />
      <View style={styles.fallbackRoadThree} />
      <View style={styles.fallbackGridLineOne} />
      <View style={styles.fallbackGridLineTwo} />
      <View style={styles.fallbackGridLineThree} />
      <View style={styles.fallbackGridLineFour} />
      <View style={[styles.mapMarker, styles.userMarker]}>
        <Ionicons name="locate" size={18} color="#FFFFFF" />
      </View>
      {selectedLocation && (
        <View style={[styles.mapMarker, styles.selectedFallbackMarker]}>
          <Ionicons name="pin" size={18} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.mapPickerFallbackBadge}>
        <Ionicons name="map-outline" size={16} color={RED} />
        <Text style={styles.mapPickerFallbackText}>Offline map picker</Text>
      </View>
    </TouchableOpacity>
  );
}

function getManualLocation(location: EmergencyLocation | null) {
  if (!location) {
    throw new Error('Choose a manual location on the map before requesting help.');
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Enter a valid latitude and longitude for the manual location.');
  }

  return {
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  };
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
  locationModeRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  locationModeButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: RED,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    height: 46,
    justifyContent: 'center',
  },
  locationModeButtonActive: { backgroundColor: RED },
  locationModeText: { color: RED, fontSize: 13, fontWeight: '900' },
  locationModeTextActive: { color: '#FFFFFF' },
  manualPickerPanel: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 12,
  },
  manualPickerTextWrap: { flex: 1, minWidth: 0 },
  manualPickerTitle: { color: NAVY, fontSize: 14, fontWeight: '900' },
  manualPickerSubtitle: { color: MUTED, fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: 3 },
  mapPickerButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  mapPickerButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  mapPickerOverlay: { backgroundColor: 'rgba(0,0,0,0.42)', flex: 1, justifyContent: 'flex-end' },
  mapPickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '88%',
    padding: 16,
  },
  mapPickerTitle: { color: NAVY, fontSize: 21, fontWeight: '900' },
  mapPickerHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mapPickerHelp: { color: MUTED, fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 4 },
  mapPickerClose: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginLeft: 12,
    width: 40,
  },
  mapPickerCanvas: { backgroundColor: '#EEF6F7', borderColor: BORDER, borderRadius: 8, borderWidth: 1, height: 360, overflow: 'hidden', position: 'relative' },
  mapPickerHint: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    top: 12,
  },
  mapPickerHintText: { color: NAVY, fontSize: 12, fontWeight: '900' },
  mapPickerFallback: { backgroundColor: '#EEF6F7', height: 360, overflow: 'hidden', position: 'relative', width: '100%' },
  mapPickerFallbackBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 8,
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    right: 12,
  },
  mapPickerFallbackText: { color: NAVY, fontSize: 12, fontWeight: '900' },
  fallbackRoadOne: { backgroundColor: '#FFFFFF', height: 34, left: -20, position: 'absolute', top: 86, transform: [{ rotate: '-16deg' }], width: '120%' },
  fallbackRoadTwo: { backgroundColor: '#DDECEF', height: 28, left: -30, position: 'absolute', top: 224, transform: [{ rotate: '12deg' }], width: '120%' },
  fallbackRoadThree: { backgroundColor: '#FFFFFF', height: 30, left: 150, position: 'absolute', top: -20, transform: [{ rotate: '82deg' }], width: 380 },
  fallbackGridLineOne: { backgroundColor: '#C8DDE2', height: 1, left: 0, opacity: 0.7, position: 'absolute', top: 70, width: '100%' },
  fallbackGridLineTwo: { backgroundColor: '#C8DDE2', height: 1, left: 0, opacity: 0.7, position: 'absolute', top: 176, width: '100%' },
  fallbackGridLineThree: { backgroundColor: '#C8DDE2', height: '100%', left: 92, opacity: 0.7, position: 'absolute', top: 0, width: 1 },
  fallbackGridLineFour: { backgroundColor: '#C8DDE2', height: '100%', opacity: 0.7, position: 'absolute', right: 86, top: 0, width: 1 },
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
  userMarker: { backgroundColor: NAVY, left: '50%', marginLeft: -18, marginTop: -18, top: '50%' },
  selectedFallbackMarker: { backgroundColor: '#00A86B', right: 86, top: 92 },
  mapPickerFooter: { marginTop: 12 },
  mapPickerCoordinates: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  submitButton: { alignItems: 'center', backgroundColor: RED, borderRadius: 8, flexDirection: 'row', gap: 8, height: 52, justifyContent: 'center', marginTop: 16 },
  buttonDisabled: { opacity: 0.7 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  submittedPanel: { alignItems: 'center' },
  submittedIcon: { alignItems: 'center', backgroundColor: '#00A86B', borderRadius: 8, height: 56, justifyContent: 'center', marginBottom: 12, width: 56 },
  submittedTitle: { color: NAVY, fontSize: 22, fontWeight: '900' },
  submittedText: { color: MUTED, fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8, textAlign: 'center' },
  waitingRow: { alignItems: 'center', backgroundColor: '#FFF7ED', borderRadius: 8, flexDirection: 'row', gap: 10, marginTop: 16, paddingHorizontal: 12, paddingVertical: 11, width: '100%' },
  waitingText: { color: '#7C2D12', flex: 1, fontSize: 13, fontWeight: '800' },
  cardDark: { backgroundColor: '#121212', borderColor: '#2A2A2A' },
  textDark: { color: '#F9FAFB' },
});
