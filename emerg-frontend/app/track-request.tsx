import React, { useEffect, useState } from 'react';
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
import { LeafletMap } from '@/src/components/leaflet-map';
import { useAppPreferences } from '@/src/lib/app-preferences';
import {
  EmergencyLocation,
  EmergencyRequest,
  EmergencyTrackingDetails,
  getEmergencyRequestDetails,
  getEmergencyRequests,
  updateMyLocation,
} from '@/src/lib/auth';
import { getOptionalCurrentEmergencyLocation } from '@/src/lib/location';

const RED = '#E63946';
const NAVY = '#1A365D';
const GREEN = '#00A86B';
const BLUE = '#3182CE';
const MUTED = '#718096';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';

const dashboardRoute = '/dashboard' as Href;
const fallbackUserLocation = { latitude: '27.7112', longitude: '85.3388' };

const activeStatuses = ['pending', 'approved', 'assigned', 'in_progress'];

type ProviderDetail = {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

type TrackRequestContentProps = {
  bottomSpacer?: number;
  onGoHome?: () => void;
};

export function TrackRequestContent({ bottomSpacer = 96, onGoHome }: TrackRequestContentProps) {
  const router = useRouter();
  const { darkMode, t } = useAppPreferences();
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
  const [trackingDetails, setTrackingDetails] = useState<EmergencyTrackingDetails | null>(null);
  const [userLocation, setUserLocation] = useState<EmergencyLocation>(fallbackUserLocation);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const refreshTracking = async () => {
      try {
        const liveLocation = await getOptionalCurrentEmergencyLocation();

        if (liveLocation) {
          updateMyLocation(liveLocation).catch(() => undefined);
          if (isMounted) {
            setUserLocation(liveLocation);
          }
        }

        const requests = await getEmergencyRequests();
        const nextActiveRequest = requests.find((request) => activeStatuses.includes(request.requestStatus || request.status || 'pending')) || null;

        if (isMounted) {
          setActiveRequest(nextActiveRequest);
          if (!nextActiveRequest) {
            setTrackingDetails(null);
          }
        }

        const requestId = nextActiveRequest?.emergencyRequestId || nextActiveRequest?.id;

        if (requestId) {
          const details = await getEmergencyRequestDetails(requestId);

          if (isMounted) {
            setTrackingDetails(details);
            setUserLocation(liveLocation || details.requester?.currentLocation || details.coordinates || nextActiveRequest.location || fallbackUserLocation);
          }
        }
      } catch {
        if (isMounted) {
          setTrackingDetails(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    refreshTracking();
    const intervalId = setInterval(refreshTracking, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const responderLocation = trackingDetails?.responderDetails?.currentLocation || null;
  const responderName = trackingDetails?.responderDetails?.name || 'Assigned admin';
  const requestStatus = trackingDetails?.requestStatus || activeRequest?.requestStatus || activeRequest?.status || 'pending';
  const isAccepted = requestStatus === 'approved' || requestStatus === 'assigned' || requestStatus === 'in_progress';
  const routeDistance = responderLocation ? calculateDistanceKm(responderLocation, userLocation) : null;
  const etaMinutes = routeDistance ? Math.max(2, Math.round((routeDistance / 24) * 60)) : null;

  const providerDetails: ProviderDetail[] = [
    { label: 'Responder', value: isAccepted ? responderName : 'Waiting', icon: 'account-hard-hat' },
    { label: 'ETA', value: etaMinutes ? `${etaMinutes} min` : '--', icon: 'clock-fast' },
    { label: 'Distance', value: routeDistance ? `${routeDistance.toFixed(1)} km` : '--', icon: 'map-marker-distance' },
  ];

  const openOpenStreetMap = async () => {
    const url = responderLocation
      ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${responderLocation.latitude}%2C${responderLocation.longitude}%3B${userLocation.latitude}%2C${userLocation.longitude}`
      : `https://www.openstreetmap.org/?mlat=${userLocation.latitude}&mlon=${userLocation.longitude}#map=16/${userLocation.latitude}/${userLocation.longitude}`;
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert('Maps unavailable', 'OpenStreetMap could not be opened on this device.');
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
              <MaterialCommunityIcons name={isAccepted ? 'map-marker-path' : 'timer-sand'} size={38} color="#FFFFFF" />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusEyebrow}>{isAccepted ? t('liveTracking') : 'Request submitted'}</Text>
              <Text style={styles.statusTitle}>{isAccepted ? t('providerOnWay') : 'Waiting for acceptance'}</Text>
              <Text style={styles.statusSubtitle}>
                {isAccepted ? `${responderName} can now track your live GPS location.` : 'Admins can see your request. Live responder tracking starts after one accepts it.'}
              </Text>
            </View>
          </View>

          <View style={styles.etaRow}>
            <View>
              <Text style={styles.etaValue}>{etaMinutes ? `${etaMinutes} min` : isLoading ? '...' : '--'}</Text>
              <Text style={styles.etaLabel}>{t('estimatedArrival')}</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t('live')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.mapPanel, darkMode && styles.cardDark]}>
          <TouchableOpacity activeOpacity={0.9} onPress={openOpenStreetMap}>
            <LeafletMap
              userLocation={userLocation}
              responderLocation={responderLocation}
              userLabel="Your location"
              responderLabel={responderName}
              fallback={
                <View style={styles.mapGrid}>
                {responderLocation && <View style={styles.routeLine} />}
                <View style={[styles.mapMarker, styles.userMarker]}>
                  <Ionicons name="person" size={18} color="#FFFFFF" />
                </View>
                {responderLocation && (
                  <>
                    <View style={[styles.mapMarker, styles.providerMarker]}>
                      <MaterialCommunityIcons name="account-hard-hat" size={19} color="#FFFFFF" />
                    </View>
                    <View style={styles.routeDotOne} />
                    <View style={styles.routeDotTwo} />
                  </>
                )}
                </View>
              }
            />
            <View style={styles.mapOpenBadge}>
              <Ionicons name="navigate" size={14} color="#FFFFFF" />
              <Text style={styles.mapOpenText}>OpenStreetMap</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.mapInfo}>
            <Text style={[styles.mapTitle, darkMode && styles.textDark]}>{isAccepted ? t('routeTitle') : 'Shared request location'}</Text>
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

function calculateDistanceKm(left: EmergencyLocation, right: EmergencyLocation) {
  const leftLat = Number(left.latitude);
  const leftLng = Number(left.longitude);
  const rightLat = Number(right.latitude);
  const rightLng = Number(right.longitude);

  if ([leftLat, leftLng, rightLat, rightLng].some((value) => Number.isNaN(value))) {
    return null;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(rightLat - leftLat);
  const dLng = toRad(rightLng - leftLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(leftLat)) * Math.cos(toRad(rightLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
