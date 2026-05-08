import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';

const trackRequestRoute = '/track-request' as Href;
=======
import { ContactsContent } from './contacts';


export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {activeTab === 'Contacts' ? (
        <ContactsContent bottomSpacer={96} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Logo */}
        <View style={styles.header}>
          {/* Using text if logo doesn't load/exist, but mostly relying on the image */}
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Section */}
        <Text style={styles.welcomeText}>
          Welcome, <Text style={styles.userName}>User</Text>
        </Text>

        {/* SOS Button Area */}
        <View style={styles.sosContainer}>
          <TouchableOpacity style={styles.sosOuterRing} activeOpacity={0.8}>
            <View style={styles.sosInnerRing}>
              <View style={styles.sosButton}>
                <MaterialCommunityIcons name="alarm-light-outline" size={48} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.tapText}>Tap in case of emergency</Text>
        
        <TouchableOpacity style={styles.drillButton}>
          <Text style={styles.drillText}>Emergency Drill</Text>
        </TouchableOpacity>

        {/* Action Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem}>
            <MaterialCommunityIcons name="police-badge" size={40} color="#E63946" />
            <Text style={styles.gridItemText}>Police Help</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <MaterialCommunityIcons name="ambulance" size={40} color="#E63946" />
            <Text style={styles.gridItemText}>Ambulance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <MaterialCommunityIcons name="fire" size={40} color="#E63946" />
            <Text style={styles.gridItemText}>Fire Rescue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => router.push(trackRequestRoute)}>
            <Ionicons name="navigate" size={40} color="#E63946" />
            <Text style={styles.gridItemText}>Track Request</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History</Text>
          
          {/* History Card 1 */}
          <View style={styles.historyCard}>
            <View style={styles.historyCardLeft}>
              <Text style={styles.historyCardTitle}>Ambulance</Text>
              <Text style={styles.historyCardDate}>April 1, 2025 9:41 PM</Text>
              <Text style={styles.historyCardLocation}>Location: XXXXXX</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#ECC94B' }]}>
              <Text style={styles.badgeText}>Pending</Text>
            </View>
          </View>

          {/* History Card 2 */}
          <View style={styles.historyCard}>
            <View style={styles.historyCardLeft}>
              <Text style={styles.historyCardTitle}>Ambulance</Text>
              <Text style={styles.historyCardDate}>April 1, 2025 9:41 PM</Text>
              <Text style={styles.historyCardLocation}>Location: XXXXXX</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#00A86B' }]}>
              <Text style={styles.badgeText}>Completed</Text>
            </View>
          </View>

          {/* History Card 3 */}
          <View style={styles.historyCard}>
            <View style={styles.historyCardLeft}>
              <Text style={styles.historyCardTitle}>Ambulance</Text>
              <Text style={styles.historyCardDate}>April 1, 2025 9:41 PM</Text>
              <Text style={styles.historyCardLocation}>Location: XXXXXX</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#00A86B' }]}>
              <Text style={styles.badgeText}>Completed</Text>
            </View>
          </View>
          
           {/* History Card 4 */}
           <View style={styles.historyCard}>
            <View style={styles.historyCardLeft}>
              <Text style={styles.historyCardTitle}>Ambulance</Text>
              <Text style={styles.historyCardDate}>April 1, 2025 9:41 PM</Text>
              <Text style={styles.historyCardLocation}>Location: XXXXXX</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#00A86B' }]}>
              <Text style={styles.badgeText}>Completed</Text>
            </View>
          </View>

        </View>

        {/* Bottom padding to ensure content isn't hidden by tab bar */}
        <View style={{ height: 80 }} />
      </ScrollView>
      )}

      {/* Custom Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Home')}>
          <View style={activeTab === 'Home' ? styles.activeTabBg : styles.inactiveTabBg}>
            <Ionicons name="home" size={24} color={activeTab === 'Home' ? "#E63946" : "#FFFFFF"} />
            <Text style={[styles.tabText, { color: activeTab === 'Home' ? "#E63946" : "#FFFFFF" }]}>Home</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Contacts')}>
          <View style={activeTab === 'Contacts' ? styles.activeTabBg : styles.inactiveTabBg}>
            <Ionicons name="call" size={24} color={activeTab === 'Contacts' ? "#E63946" : "#FFFFFF"} />
            <Text style={[styles.tabText, { color: activeTab === 'Contacts' ? "#E63946" : "#FFFFFF" }]}>Contacts</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('Track');
            router.push(trackRequestRoute);
          }}
        >
          <View style={activeTab === 'Track' ? styles.activeTabBg : styles.inactiveTabBg}>
            <Ionicons name="map" size={24} color={activeTab === 'Track' ? "#E63946" : "#FFFFFF"} />
            <Text style={[styles.tabText, { color: activeTab === 'Track' ? "#E63946" : "#FFFFFF" }]}>Track</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Settings')}>
          <View style={activeTab === 'Settings' ? styles.activeTabBg : styles.inactiveTabBg}>
            <Ionicons name="settings" size={24} color={activeTab === 'Settings' ? "#E63946" : "#FFFFFF"} />
            <Text style={[styles.tabText, { color: activeTab === 'Settings' ? "#E63946" : "#FFFFFF" }]}>Settings</Text>
          </View>
        </TouchableOpacity>
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
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 50,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#1A365D',
    marginBottom: 30,
  },
  userName: {
    color: '#E63946',
    fontWeight: '600',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  sosOuterRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosInnerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(230, 57, 70, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tapText: {
    textAlign: 'center',
    color: '#A0AEC0',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  drillButton: {
    backgroundColor: '#F0F5F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 30,
  },
  drillText: {
    color: '#1A365D',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A365D',
    letterSpacing: 0.5,
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyCardLeft: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A365D',
    marginBottom: 4,
  },
  historyCardDate: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 6,
  },
  historyCardLocation: {
    fontSize: 13,
    color: '#1A365D',
    fontWeight: '500',
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
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#E63946',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20, // for safe area
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBg: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTabBg: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
