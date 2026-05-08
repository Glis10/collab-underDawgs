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
import { AppBottomNav } from '@/components/app-bottom-nav';

const RED = '#E63946';
const NAVY = '#1A365D';
const GREEN = '#00A86B';
const BLUE = '#3182CE';
const MUTED = '#718096';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';

const dashboardRoute = '/dashboard' as Href;

const providerDetails = [
  { label: 'Unit', value: 'Ambulance A-04', icon: 'ambulance' },
  { label: 'ETA', value: '6 min', icon: 'clock-fast' },
  { label: 'Distance', value: '1.8 km', icon: 'map-marker-distance' },
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
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={styles.callButton} activeOpacity={0.75}>
            <Ionicons name="call-outline" size={22} color={RED} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusPanel}>
          <View style={styles.statusTopRow}>
            <View style={styles.statusIconWrap}>
              <MaterialCommunityIcons name="ambulance" size={38} color="#FFFFFF" />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusEyebrow}>Live tracking</Text>
              <Text style={styles.statusTitle}>Provider is on the way</Text>
              <Text style={styles.statusSubtitle}>Ambulance A-04 is heading to your shared location.</Text>
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

        <View style={{ height: 96 }} />
      </ScrollView>

      <AppBottomNav activeTab="Track" />
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
    justifyContent: 'center',
    marginBottom: 18,
  },
  callButton: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
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
