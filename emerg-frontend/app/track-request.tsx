import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const RED = '#E63946';
const NAVY = '#1A365D';
const GREEN = '#00A86B';
const BLUE = '#3182CE';
const YELLOW = '#ECC94B';
const MUTED = '#718096';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';

const dashboardRoute = '/dashboard' as Href;

const responseSteps = [
  {
    title: 'Request confirmed',
    time: '9:41 PM',
    detail: 'Emergency desk verified your ambulance request.',
    icon: 'checkmark-done-circle',
    color: GREEN,
    isComplete: true,
  },
  {
    title: 'Provider assigned',
    time: '9:43 PM',
    detail: 'Ambulance A-04 accepted the dispatch.',
    icon: 'person-circle',
    color: BLUE,
    isComplete: true,
  },
  {
    title: 'Provider on the way',
    time: 'Now',
    detail: 'Responder is moving toward your shared location.',
    icon: 'navigate-circle',
    color: RED,
    isComplete: false,
  },
  {
    title: 'Arriving soon',
    time: 'ETA 6 min',
    detail: 'Keep your phone nearby for provider calls.',
    icon: 'location',
    color: YELLOW,
    isComplete: false,
  },
] as const satisfies readonly {
  title: string;
  time: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isComplete: boolean;
}[];

const providerDetails = [
  { label: 'Unit', value: 'Ambulance A-04', icon: 'ambulance' },
  { label: 'Responder', value: 'Dr. Suman Rai', icon: 'account-heart-outline' },
  { label: 'Distance', value: '1.8 km away', icon: 'map-marker-distance' },
] as const satisfies readonly {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[];

export default function TrackRequestScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.75} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={NAVY} />
          </TouchableOpacity>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
            <Ionicons name="call-outline" size={22} color={RED} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusPanel}>
          <View style={styles.statusTopRow}>
            <View style={styles.statusIconWrap}>
              <MaterialCommunityIcons name="ambulance" size={38} color="#FFFFFF" />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusEyebrow}>Confirmed request</Text>
              <Text style={styles.statusTitle}>Provider is on the way</Text>
              <Text style={styles.statusSubtitle}>Ambulance dispatch accepted at 9:43 PM.</Text>
            </View>
          </View>

          <View style={styles.etaRow}>
            <View>
              <Text style={styles.etaValue}>6 min</Text>
              <Text style={styles.etaLabel}>Estimated arrival</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapPanel}>
          <View style={styles.mapGrid}>
            <View style={styles.routeLine} />
            <View style={[styles.mapMarker, styles.userMarker]}>
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>
            <View style={[styles.mapMarker, styles.providerMarker]}>
              <MaterialCommunityIcons name="ambulance" size={19} color="#FFFFFF" />
            </View>
            <View style={styles.routeDotOne} />
            <View style={styles.routeDotTwo} />
          </View>
          <View style={styles.mapInfo}>
            <Text style={styles.mapTitle}>Route to your location</Text>
            <Text style={styles.mapText}>Lakeside Road, Pokhara</Text>
          </View>
        </View>

        <View style={styles.providerGrid}>
          {providerDetails.map((item) => (
            <View key={item.label} style={styles.providerCard}>
              <View style={styles.providerIcon}>
                <MaterialCommunityIcons name={item.icon} size={23} color={RED} />
              </View>
              <Text style={styles.providerLabel}>{item.label}</Text>
              <Text style={styles.providerValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Request Progress</Text>
          <Text style={styles.requestId}>#ER-2041</Text>
        </View>

        <View style={styles.timeline}>
          {responseSteps.map((step, index) => (
            <View key={step.title} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.stepIcon, { backgroundColor: step.color }]}>
                  <Ionicons name={step.icon} size={20} color="#FFFFFF" />
                </View>
                {index < responseSteps.length - 1 && (
                  <View style={[styles.stepConnector, step.isComplete && styles.stepConnectorComplete]} />
                )}
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTopRow}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
                <Text style={styles.stepDetail}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.safetyPanel}>
          <View style={styles.safetyIcon}>
            <Ionicons name="shield-checkmark-outline" size={23} color={NAVY} />
          </View>
          <View style={styles.safetyTextWrap}>
            <Text style={styles.safetyTitle}>Stay visible and reachable</Text>
            <Text style={styles.safetyText}>Keep the entrance clear and answer calls from the responder team.</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryAction} activeOpacity={0.8}>
            <Ionicons name="call-outline" size={18} color={RED} />
            <Text style={styles.secondaryActionText}>Call Provider</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryAction} activeOpacity={0.8} onPress={() => router.replace(dashboardRoute)}>
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Home</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 26 }} />
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  logo: {
    height: 50,
    width: 150,
  },
  statusPanel: {
    backgroundColor: RED,
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  statusTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
    fontWeight: '800',
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
    lineHeight: 18,
    marginTop: 5,
  },
  etaRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.22)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
  },
  etaValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  etaLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveDot: {
    backgroundColor: GREEN,
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  liveText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '900',
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
    fontWeight: '600',
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
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    marginBottom: 10,
    width: 38,
  },
  providerLabel: {
    color: FAINT,
    fontSize: 11,
    fontWeight: '800',
  },
  providerValue: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    marginTop: 4,
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
  requestId: {
    color: RED,
    fontSize: 13,
    fontWeight: '900',
  },
  timeline: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 82,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
    width: 34,
  },
  stepIcon: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  stepConnector: {
    backgroundColor: BORDER,
    flex: 1,
    marginVertical: 6,
    width: 2,
  },
  stepConnectorComplete: {
    backgroundColor: GREEN,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepTitle: {
    color: NAVY,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
  },
  stepTime: {
    color: FAINT,
    fontSize: 12,
    fontWeight: '900',
  },
  stepDetail: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  safetyPanel: {
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    borderColor: '#BEE3F8',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 14,
  },
  safetyIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  safetyTextWrap: {
    flex: 1,
  },
  safetyTitle: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '900',
  },
  safetyText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: RED,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    width: '48%',
  },
  secondaryActionText: {
    color: RED,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    width: '48%',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },
});
