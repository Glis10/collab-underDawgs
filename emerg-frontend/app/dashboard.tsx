import { AppBottomNav } from '@/components/app-bottom-nav';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const trackRequestRoute = '/track-request' as Href;
const RED = '#E63946';
const NAVY = '#1A365D';
const GREEN = '#00A86B';
const YELLOW = '#ECC94B';
const MUTED = '#718096';
const FAINT = '#A0AEC0';
const BORDER = '#E2E8F0';
const SURFACE = '#F7FAFC';

const emergencyActions = [
  { label: 'Police Help', icon: 'police-badge', tone: '#E63946' },
  { label: 'Ambulance', icon: 'ambulance', tone: '#3182CE' },
  { label: 'Fire Rescue', icon: 'fire-truck', tone: '#DD6B20' },
] as const satisfies readonly {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: string;
}[];

const recentRequests = [
  { title: 'Ambulance', date: 'April 1, 2025 9:41 PM', location: 'Lakeside Road', status: 'Pending', color: YELLOW },
  { title: 'Police Help', date: 'March 24, 2025 4:18 PM', location: 'New Road', status: 'Completed', color: GREEN },
  { title: 'Fire Rescue', date: 'March 10, 2025 11:05 AM', location: 'Mahendrapul', status: 'Completed', color: GREEN },
] as const;

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.8}>
            <Ionicons name="person" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.welcomeLabel}>Welcome back</Text>
              <Text style={styles.welcomeText}>User</Text>
            </View>
            <View style={styles.readyBadge}>
              <View style={styles.readyDot} />
              <Text style={styles.readyText}>Ready</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color={RED} />
              <View>
                <Text style={styles.infoLabel}>Current area</Text>
                <Text style={styles.infoValue}>Kathmandu</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={GREEN} />
              <View>
                <Text style={styles.infoLabel}>Network</Text>
                <Text style={styles.infoValue}>Online</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sosPanel}>
          <View style={styles.sosCopy}>
            <Text style={styles.sosTitle}>Emergency SOS</Text>
            <Text style={styles.sosSubtitle}>Send your live location to nearby responders.</Text>
          </View>
          <View style={styles.sosContainer}>
            <TouchableOpacity style={styles.sosOuterRing} activeOpacity={0.8}>
              <View style={styles.sosInnerRing}>
                <View style={styles.sosButton}>
                  <MaterialCommunityIcons name="alarm-light-outline" size={46} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.tapText}>Tap and hold in case of emergency</Text>
        </View>
        
        <View style={styles.utilityRow}>
          <TouchableOpacity style={styles.utilityButton} activeOpacity={0.8}>
            <Ionicons name="refresh-circle-outline" size={18} color={NAVY} />
            <Text style={styles.utilityText}>Emergency Drill</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.utilityButton} activeOpacity={0.8} onPress={() => router.replace(trackRequestRoute)}>
            <Ionicons name="navigate-circle-outline" size={18} color={NAVY} />
            <Text style={styles.utilityText}>Track Active</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          <Text style={styles.sectionHint}>Choose service</Text>
        </View>
        <View style={styles.gridContainer}>
          {emergencyActions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.gridItem} activeOpacity={0.82}>
              <View style={[styles.gridIcon, { backgroundColor: `${action.tone}14` }]}>
                <MaterialCommunityIcons name={action.icon} size={31} color={action.tone} />
              </View>
              <Text style={styles.gridItemText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.gridItem} onPress={() => router.replace(trackRequestRoute)}>
            <View style={styles.gridIcon}>
              <Ionicons name="navigate" size={31} color={RED} />
            </View>
            <Text style={styles.gridItemText}>Track Request</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            <Text style={styles.sectionHint}>Last activity</Text>
          </View>

          {recentRequests.map((request) => (
            <View key={`${request.title}-${request.date}`} style={styles.historyCard}>
              <View style={styles.historyIcon}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color={NAVY} />
              </View>
              <View style={styles.historyCardLeft}>
                <Text style={styles.historyCardTitle}>{request.title}</Text>
                <Text style={styles.historyCardDate}>{request.date}</Text>
                <Text style={styles.historyCardLocation}>{request.location}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: request.color }]}>
                <Text style={styles.badgeText}>{request.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      <AppBottomNav activeTab="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  logo: {
    width: 150,
    height: 50,
  },
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  heroPanel: {
    backgroundColor: NAVY,
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  welcomeLabel: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 13,
    fontWeight: '700',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  readyBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 8,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  readyDot: {
    backgroundColor: GREEN,
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  readyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  infoDivider: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 10,
    width: 1,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  sosPanel: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  sosCopy: {
    alignItems: 'center',
  },
  sosTitle: {
    color: NAVY,
    fontSize: 22,
    fontWeight: '900',
  },
  sosSubtitle: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 5,
    maxWidth: 260,
    textAlign: 'center',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 18,
  },
  sosOuterRing: {
    width: 158,
    height: 158,
    borderRadius: 79,
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosInnerRing: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: 'rgba(230, 57, 70, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tapText: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
  },
  utilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  utilityButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
  },
  utilityText: {
    color: NAVY,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 7,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHint: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    minHeight: 122,
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  gridItemText: {
    fontSize: 15,
    fontWeight: '900',
    color: NAVY,
    lineHeight: 20,
  },
  historySection: {
    marginTop: 2,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  historyIcon: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    marginRight: 11,
    width: 42,
  },
  historyCardLeft: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
    marginBottom: 3,
  },
  historyCardDate: {
    fontSize: 12,
    color: FAINT,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyCardLocation: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});