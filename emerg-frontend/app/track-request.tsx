import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  const [activeRequests, setActiveRequests] = useState<EmergencyRequest[]>([]);
  const [trackingDetails, setTrackingDetails] = useState<EmergencyTrackingDetails | null>(null);
  const [trackingDetailsList, setTrackingDetailsList] = useState<EmergencyTrackingDetails[]>([]);
  const [userLocation, setUserLocation] = useState<EmergencyLocation>(fallbackUserLocation);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const refreshTracking = async () => {
      try {
        const liveLocation = await getOptionalCurrentEmergencyLocation();

        if (liveLocation) {
          updateMyLocation(liveLocation).catch(() => undefined);
        }

        const requests = await getEmergencyRequests();
        const nextActiveRequests = requests.filter((request) => activeStatuses.includes(request.requestStatus || request.status || 'pending'));
        const nextActiveRequest = nextActiveRequests.find((request) => (request.requestStatus || request.status) !== 'pending') || nextActiveRequests[0] || null;

        if (isMounted) {
          setActiveRequests(nextActiveRequests);
          setActiveRequest(nextActiveRequest);
          if (!nextActiveRequest) {
            setTrackingDetails(null);
            setTrackingDetailsList([]);
          }
        }

        const requestIds = nextActiveRequests
          .map((request) => request.emergencyRequestId || request.id)
          .filter(Boolean);

        if (requestIds.length > 0) {
          const detailsList = await Promise.all(requestIds.map((requestId) => getEmergencyRequestDetails(requestId)));
          const primaryDetails = detailsList.find((details) => details.requestStatus !== 'pending') || detailsList[0];

          if (isMounted) {
            setTrackingDetails(primaryDetails);
            setTrackingDetailsList(detailsList);
            setUserLocation(getRequestedLocation(primaryDetails, nextActiveRequest) || liveLocation || fallbackUserLocation);
          }
        } else if (isMounted && liveLocation) {
          setUserLocation(liveLocation);
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

  const responderLocations = trackingDetailsList
    .filter((details) => details.requestStatus === 'approved' || details.requestStatus === 'assigned' || details.requestStatus === 'in_progress')
    .map((details) => ({
      location: details.responderDetails?.currentLocation,
      label: details.responderDetails?.name || getServiceLabel(details.serviceType || details.emergencyType),
      service: getServiceLabel(details.serviceType || details.emergencyType),
    }))
    .filter((item): item is { location: EmergencyLocation; label: string; service: string } => Boolean(item.location?.latitude && item.location.longitude));
  const responderLocation = responderLocations[0]?.location || trackingDetails?.responderDetails?.currentLocation || null;
  const responderName = trackingDetails?.responderDetails?.name || 'Assigned admin';
  const requestStatus = trackingDetails?.requestStatus || activeRequest?.requestStatus || activeRequest?.status || 'pending';
  const isAccepted = requestStatus === 'approved' || requestStatus === 'assigned' || requestStatus === 'in_progress';
  const routeDistance = responderLocation ? calculateDistanceKm(responderLocation, userLocation) : null;
  const etaMinutes = routeDistance ? Math.max(2, Math.round((routeDistance / 24) * 60)) : null;

  const providerDetails: ProviderDetail[] = [
    { label: 'Responders', value: responderLocations.length > 0 ? `${responderLocations.length}/${isSosRequest(activeRequests) ? 3 : 1}` : 'Waiting', icon: 'account-hard-hat' },
    { label: 'ETA', value: etaMinutes ? `${etaMinutes} min` : '--', icon: 'clock-fast' },
    { label: 'Distance', value: routeDistance ? `${routeDistance.toFixed(1)} km` : '--', icon: 'map-marker-distance' },
  ];

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={RED} />
        <Text style={styles.centerStateText}>Checking your service requests...</Text>
      </View>
    );
  }

  if (!activeRequest) {
    return (
      <View style={styles.centerState}>
        <View style={[styles.emptyIcon, darkMode && styles.cardDark]}>
          <MaterialCommunityIcons name="map-search-outline" size={34} color={RED} />
        </View>
        <Text style={[styles.emptyTitle, darkMode && styles.textDark]}>No service requested</Text>
        <Text style={styles.emptySubtitle}>Request ambulance, police, or fire help first, then live tracking will appear here.</Text>
        <TouchableOpacity style={styles.primaryWideAction} activeOpacity={0.8} onPress={onGoHome ?? (() => router.replace(dashboardRoute))}>
          <Ionicons name="home-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>{t('home')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
      <View style={styles.mapFirstContent}>
        <View style={styles.mapCanvas}>
          <LeafletMap
            userLocation={userLocation}
            responderLocation={responderLocation}
            responderLocations={responderLocations.map((item) => ({
              location: item.location,
              label: `${item.service}: ${item.label}`,
            }))}
            userLabel="Your location"
            responderLabel={responderName}
            height={420}
            fitMaxZoom={13}
            fallback={
              <View style={styles.mapGridLarge}>
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
          <View style={styles.mapTopBar}>
            <Image source={require('../assets/logo.png')} style={styles.logoSmall} resizeMode="contain" />
            <TouchableOpacity style={[styles.roundMapButton, darkMode && styles.cardDark]} activeOpacity={0.75}>
              <Ionicons name="call-outline" size={22} color={RED} />
            </TouchableOpacity>
          </View>
          <View style={styles.mapStatusPill}>
            <View style={styles.liveDot} />
            <Text style={styles.mapStatusText}>{isAccepted ? 'Live trip tracking' : 'Request pending'}</Text>
          </View>
        </View>

        <View style={[styles.rideSheet, darkMode && styles.cardDark]}>
          <View style={styles.sheetHandle} />
          <View style={styles.statusTopRow}>
            <View style={styles.statusIconWrap}>
              <MaterialCommunityIcons name={isAccepted ? 'map-marker-path' : 'timer-sand'} size={32} color="#FFFFFF" />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={[styles.sheetEyebrow, darkMode && styles.mutedTextDark]}>{isAccepted ? t('liveTracking') : 'Request submitted'}</Text>
              <Text style={[styles.sheetTitle, darkMode && styles.textDark]}>{isAccepted ? t('providerOnWay') : 'Waiting for acceptance'}</Text>
              <Text style={styles.sheetSubtitle}>
                {isAccepted ? `${responderLocations.length || 1} responder${(responderLocations.length || 1) === 1 ? '' : 's'} can now track your live GPS location.` : 'Admins can see your request. Live responder tracking starts after one accepts it.'}
              </Text>
            </View>
          </View>

          {isSosRequest(activeRequests) && (
            <View style={styles.criticalStrip}>
              <MaterialCommunityIcons name="alarm-light" size={18} color="#FFFFFF" />
              <Text style={styles.criticalStripText}>Critical SOS: tracking ambulance, police, and fire response</Text>
            </View>
          )}

          <View style={styles.tripStatsRow}>
            {providerDetails.map((item) => (
              <View key={item.label} style={styles.tripStat}>
                <MaterialCommunityIcons name={item.icon} size={20} color={RED} />
                <Text style={styles.tripStatLabel}>{item.label}</Text>
                <Text style={[styles.tripStatValue, darkMode && styles.textDark]}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.mapInfoInline}>
            <Ionicons name="location-outline" size={18} color={RED} />
            <View style={styles.mapInfoTextWrap}>
              <Text style={[styles.mapTitle, darkMode && styles.textDark]}>{isAccepted ? t('routeTitle') : 'Shared request location'}</Text>
              <Text style={styles.mapText}>{userLocation.latitude}, {userLocation.longitude}</Text>
            </View>
          </View>

          {responderLocations.length > 0 && (
            <View style={styles.responderList}>
              {responderLocations.map((item) => (
                <View key={`${item.service}-${item.label}`} style={styles.responderChip}>
                  <MaterialCommunityIcons name="account-hard-hat" size={16} color={RED} />
                  <Text style={styles.responderChipText}>{item.service}</Text>
                </View>
              ))}
            </View>
          )}

        </View>

        <View style={{ height: bottomSpacer }} />
      </View>
  );
}

function getRequestedLocation(details?: EmergencyTrackingDetails | null, request?: EmergencyRequest | null) {
  return (
    details?.coordinates ||
    request?.location ||
    request?.emergencyLocation ||
    request?.currentLocation ||
    details?.requester?.currentLocation ||
    null
  );
}

function getServiceLabel(serviceType?: string) {
  if (serviceType === 'police') {
    return 'Police';
  }

  if (serviceType === 'fire_truck' || serviceType === 'fire') {
    return 'Fire';
  }

  return 'Ambulance';
}

function isSosRequest(requests: EmergencyRequest[]) {
  return requests.some((request) => (request.description || request.emergencyDescription || '').toLowerCase().includes('sos'));
}

/*
  Kept below as a reference for older card-style tracking. The active UI above is
  intentionally map-first, closer to ride-hailing apps.
*/
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
  mapFirstContent: {
    flex: 1,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centerStateText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderColor: '#FED7D7',
    borderRadius: 8,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 16,
    width: 72,
  },
  emptyTitle: {
    color: NAVY,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 320,
    textAlign: 'center',
  },
  mapCanvas: {
    backgroundColor: '#EEF6F7',
    height: 420,
    position: 'relative',
  },
  mapGridLarge: {
    backgroundColor: '#EEF6F7',
    height: 420,
    position: 'relative',
  },
  mapTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
    top: 12,
  },
  logoSmall: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    height: 44,
    width: 126,
  },
  roundMapButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  mapStatusPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 8,
    bottom: 18,
    flexDirection: 'row',
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    position: 'absolute',
  },
  mapStatusText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 7,
  },
  rideSheet: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    marginTop: -22,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: BORDER,
    borderRadius: 2,
    height: 4,
    marginBottom: 14,
    width: 44,
  },
  sheetEyebrow: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: NAVY,
    fontSize: 20,
    fontWeight: '900',
  },
  sheetSubtitle: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  tripStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  criticalStrip: {
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  criticalStripText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  tripStat: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 78,
    padding: 9,
  },
  tripStatLabel: {
    color: FAINT,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 7,
  },
  tripStatValue: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  mapInfoInline: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 10,
  },
  mapInfoTextWrap: {
    flex: 1,
  },
  responderList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  responderChip: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderColor: '#FED7D7',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  responderChipText: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
  },
  mutedTextDark: {
    color: '#CBD5E1',
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
    height: 48,
    justifyContent: 'center',
    marginRight: 13,
    width: 48,
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
  primaryActionWide: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    width: '100%',
  },
  primaryWideAction: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 22,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },
});
