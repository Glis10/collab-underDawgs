import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import {
  createEmergencyContact,
  deleteEmergencyContact,
  EmergencyContact,
  getCommonEmergencyContacts,
  getEmergencyContacts,
} from '@/src/lib/auth';

const dashboardRoute = '/dashboard' as Href;

type ContactsContentProps = {
  bottomSpacer?: number;
};

const fallbackServiceNumbers: EmergencyContact[] = [
  {
    id: 'police',
    name: 'Police',
    relationship: 'Emergency service',
    phoneNumber: '100',
    isCommonContact: true,
  },
  {
    id: 'ambulance',
    name: 'Ambulance',
    relationship: 'Emergency service',
    phoneNumber: '102',
    isCommonContact: true,
  },
  {
    id: 'fire',
    name: 'Fire Rescue',
    relationship: 'Emergency service',
    phoneNumber: '101',
    isCommonContact: true,
  },
];

export function ContactsContent({ bottomSpacer = 96 }: ContactsContentProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [commonContacts, setCommonContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const serviceContacts = useMemo(
    () => (commonContacts.length > 0 ? commonContacts : fallbackServiceNumbers),
    [commonContacts]
  );

  const loadContacts = useCallback(async () => {
    const [saved, common] = await Promise.all([
      getEmergencyContacts(),
      getCommonEmergencyContacts().catch(() => []),
    ]);

    setContacts(saved);
    setCommonContacts(common);
  }, []);

  useEffect(() => {
    loadContacts()
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unable to load emergency contacts.';
        Alert.alert('Contacts unavailable', message);
      })
      .finally(() => setIsLoading(false));
  }, [loadContacts]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadContacts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to refresh contacts.';
      Alert.alert('Refresh failed', message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCall = async (number: string) => {
    const phoneUrl = `tel:${number}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (!canOpen) {
      Alert.alert('Call unavailable', 'This device cannot place a call from the app.');
      return;
    }

    Linking.openURL(phoneUrl);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const newContact = await createEmergencyContact({
        name,
        relationship,
        phoneNumber,
      });

      setContacts((current) => [newContact, ...current]);
      setName('');
      setRelationship('');
      setPhoneNumber('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save this contact.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteEmergencyContact(id);
      setContacts((current) => current.filter((contact) => contact.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete this contact.';
      Alert.alert('Delete failed', message);
    } finally {
      setDeletingId(null);
    }
  };

  const renderContact = (contact: EmergencyContact, canDelete = false) => (
    <View key={contact.id} style={styles.contactCard}>
      <View style={styles.contactIcon}>
        <Ionicons name={canDelete ? 'person' : 'business'} size={22} color="#E63946" />
      </View>

      <View style={styles.contactContent}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactMeta}>{contact.relationship}</Text>
        <Text style={styles.contactNumber}>{contact.phoneNumber}</Text>
      </View>

      <TouchableOpacity style={styles.iconButton} onPress={() => handleCall(contact.phoneNumber)}>
        <Ionicons name="call" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {canDelete && (
        <TouchableOpacity
          style={[styles.deleteButton, deletingId === contact.id && styles.buttonDisabled]}
          onPress={() => handleDelete(contact.id)}
          disabled={deletingId === contact.id}
        >
          {deletingId === contact.id ? (
            <ActivityIndicator size="small" color="#E63946" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#E63946" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.contentContainer, styles.centered]}>
        <ActivityIndicator color="#E63946" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Emergency Contacts</Text>
          <Text style={styles.subtitle}>Store numbers you may need fast</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.formPanel}>
          <Text style={styles.sectionTitle}>Add service number</Text>

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="account" size={20} color="#718096" />
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#A0AEC0"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="shield-account" size={20} color="#718096" />
            <TextInput
              style={styles.input}
              placeholder="Service type"
              placeholderTextColor="#A0AEC0"
              value={relationship}
              onChangeText={setRelationship}
            />
          </View>

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="phone" size={20} color="#718096" />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#A0AEC0"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <TouchableOpacity style={[styles.saveButton, isSaving && styles.buttonDisabled]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Contact</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency services</Text>
          {serviceContacts.map((contact) => renderContact(contact))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My saved numbers</Text>
          {contacts.length > 0 ? (
            contacts.map((contact) => renderContact(contact, true))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="call-outline" size={28} color="#A0AEC0" />
              <Text style={styles.emptyText}>No saved emergency contacts yet.</Text>
            </View>
          )}
        </View>

        <View style={{ height: bottomSpacer }} />
      </ScrollView>
    </View>
  );
}

export default function ContactsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Contacts');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ContactsContent bottomSpacer={96} />

      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace(dashboardRoute)}>
          <View style={activeTab === 'Home' ? styles.activeTabBg : styles.inactiveTabBg}>
            <Ionicons name="home" size={24} color={activeTab === 'Home' ? '#E63946' : '#FFFFFF'} />
            <Text style={[styles.tabText, { color: activeTab === 'Home' ? '#E63946' : '#FFFFFF' }]}>Home</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Contacts')}>
          <View style={activeTab === 'Contacts' ? styles.activeTabBg : styles.inactiveTabBg}>
            <Ionicons name="call" size={24} color={activeTab === 'Contacts' ? '#E63946' : '#FFFFFF'} />
            <Text style={[styles.tabText, { color: activeTab === 'Contacts' ? '#E63946' : '#FFFFFF' }]}>Contacts</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Track')}>
          <View style={activeTab === 'Track' ? styles.activeTabBg : styles.inactiveTabBg}>
            <Ionicons name="map" size={24} color={activeTab === 'Track' ? '#E63946' : '#FFFFFF'} />
            <Text style={[styles.tabText, { color: activeTab === 'Track' ? '#E63946' : '#FFFFFF' }]}>Track</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Settings')}>
          <View style={activeTab === 'Settings' ? styles.activeTabBg : styles.inactiveTabBg}>
            <Ionicons name="settings" size={24} color={activeTab === 'Settings' ? '#E63946' : '#FFFFFF'} />
            <Text style={[styles.tabText, { color: activeTab === 'Settings' ? '#E63946' : '#FFFFFF' }]}>Settings</Text>
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
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  title: {
    color: '#1A365D',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#718096',
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  formPanel: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#1A365D',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputGroup: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#2D3748',
    fontSize: 15,
  },
  saveButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#E63946',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  contactCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
  },
  contactContent: {
    flex: 1,
  },
  contactName: {
    color: '#1A365D',
    fontSize: 16,
    fontWeight: '700',
  },
  contactMeta: {
    color: '#718096',
    fontSize: 12,
    marginTop: 2,
  },
  contactNumber: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
  },
  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  emptyState: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E0',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    padding: 18,
  },
  emptyText: {
    color: '#718096',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
    paddingBottom: 20,
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
