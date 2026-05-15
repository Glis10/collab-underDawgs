import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
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
import { useAppPreferences } from '@/src/lib/app-preferences';
import { getCurrentEmergencyLocation } from '@/src/lib/location';

const RED = '#E63946';
const NAVY = '#1A365D';
const GREEN = '#00A86B';
const BLUE = '#3182CE';
const MUTED = '#718096';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const dashboardRoute = '/dashboard' as Href;
const fallbackUserLocation = { latitude: '28.2096', longitude: '83.9856' };
const providerLocation = { latitude: '28.2170', longitude: '83.9778' };

const providerDetails = [
  { label: 'Unit', value: 'Ambulance A-04', icon: 'ambulance' },
  { label: 'ETA', value: '6 min', icon: 'clock-fast' },
  { label: 'Distance', value: '1.8 km', icon: 'map-marker-distance' },
] as const satisfies readonly {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[];

type TrackRequestContentProps = {
  bottomSpacer?: number;
  onGoHome?: () => void;
};

export function TrackRequestContent({ bottomSpacer = 96, onGoHome }: TrackRequestContentProps) {
  const router = useRouter();
  const { darkMode, t } = useAppPreferences();
  const [userLocation, setUserLocation] = useState(fallbackUserLocation);

  useEffect(() => {
    let isMounted = true;

    getCurrentEmergencyLocation()
      .then((location) => {
        if (isMounted) {
          setUserLocation(location);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUserLocation(fallbackUserLocation);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const mapImageUrl = useMemo(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      return null;
    }

    const origin = `${providerLocation.latitude},${providerLocation.longitude}`;
    const destination = `${userLocation.latitude},${userLocation.longitude}`;
    const params = new URLSearchParams({
      center: destination,
      zoom: '14',
      size: '640x360',
      scale: '2',
      maptype: 'roadmap',
      markers: `color:red|label:A|${origin}`,
      path: `color:0x3182CEFF|weight:5|${origin}|${destination}`,
      key: GOOGLE_MAPS_API_KEY,
    });

    params.append('markers', `color:blue|label:U|${destination}`);

    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  }, [userLocation]);

  const openGoogleMaps = async () => {
    const destination = `${userLocation.latitude},${userLocation.longitude}`;
    const origin = `${providerLocation.latitude},${providerLocation.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert('Maps unavailable', 'Google Maps could not be opened on this device.');
      return;
    }

    await Linking.openURL(url);
  };

  return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={[styles.callButton, darkMode && styles.cardDark]} activeOpacity={0.75}>
            <Ionicons name="call-outline" size={22} color={RED} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusPanel}>
          <View style={styles.statusTopRow}>
            <View style={styles.statusIconWrap}>
              <MaterialCommunityIcons name="ambulance" size={38} color="#FFFFFF" />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusEyebrow}>{t('liveTracking')}</Text>
              <Text style={styles.statusTitle}>{t('providerOnWay')}</Text>
              <Text style={styles.statusSubtitle}>{t('providerSubtitle')}</Text>
            </View>
          </View>

          <View style={styles.etaRow}>
            <View>
              <Text style={styles.etaValue}>6 min</Text>
              <Text style={styles.etaLabel}>{t('estimatedArrival')}</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t('live')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.mapPanel, darkMode && styles.cardDark]}>
          <TouchableOpacity activeOpacity={0.9} onPress={openGoogleMaps}>
            {mapImageUrl ? (
              <Image source={{ uri: mapImageUrl }} style={styles.mapImage} resizeMode="cover" />
            ) : (
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
            )}
            <View style={styles.mapOpenBadge}>
              <Ionicons name="navigate" size={14} color="#FFFFFF" />
              <Text style={styles.mapOpenText}>Google Maps</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.mapInfo}>
            <Text style={[styles.mapTitle, darkMode && styles.textDark]}>{t('routeTitle')}</Text>
            <Text style={styles.mapText}>
              {userLocation.latitude}, {userLocation.longitude}
            </Text>
          </View>
        </View>

        <View style={styles.providerGrid}>
          {providerDetails.map((item) => (
            <View key={item.label} style={[styles.providerCard, darkMode && styles.cardDark]}>
              <View style={styles.providerIcon}>
                <MaterialCommunityIcons name={item.icon} size={23} color={RED} />
              </View>
              <Text style={styles.providerLabel}>{item.label}</Text>
              <Text style={[styles.providerValue, darkMode && styles.textDark]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryAction} activeOpacity={0.8}>
            <Ionicons name="call-outline" size={18} color={RED} />
            <Text style={styles.secondaryActionText}>{t('callProvider')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryAction} activeOpacity={0.8} onPress={onGoHome ?? (() => router.replace(dashboardRoute))}>
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>{t('home')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: bottomSpacer }} />
      </ScrollView>
  );
}

export default function TrackRequestScreen() {
  const { darkMode } = useAppPreferences();

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top', 'left', 'right']}>
      <TrackRequestContent bottomSpacer={96} />

      <AppBottomNav activeTab="Track" />
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
  cardDark: {
    backgroundColor: '#121212',
    borderColor: '#2A2A2A',
  },
  textDark: {
    color: '#F9FAFB',
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
  mapImage: {
    backgroundColor: '#EEF6F7',
    height: 190,
    width: '100%',
  },
  mapOpenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(26, 54, 93, 0.9)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  mapOpenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
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
