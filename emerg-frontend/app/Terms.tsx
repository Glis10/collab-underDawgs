import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const sections = [
  {
    title: '1. Using the App',
    body:
      'Use this app only for lawful and safety-focused purposes. You are responsible for the accuracy of the information you submit.',
  },
  {
    title: '2. Account Responsibility',
    body:
      'Keep your sign-in details private and notify the team if you believe your account has been accessed without permission.',
  },
  {
    title: '3. Emergency Information',
    body:
      'The app may help organize emergency-related information, but it does not replace direct help from police, hospitals, or other official responders.',
  },
  {
    title: '4. Privacy',
    body:
      'We aim to handle your information responsibly and only use the data needed to provide the service and improve reliability.',
  },
  {
    title: '5. Changes to These Terms',
    body:
      'These terms may be updated over time. Continued use of the app after changes means you accept the revised terms.',
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A365D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.subtitle}>
          Please read these terms carefully before using the application.
        </Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <Text style={styles.footerText}>
          If you do not agree with these terms, please discontinue use of the app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '400',
    color: '#1A365D',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
  },
  footerText: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 20,
    marginTop: 8,
  },
});
