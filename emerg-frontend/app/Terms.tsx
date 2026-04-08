import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>By accessing and using the Pahilo Uddhar application, you accept and agree to be bound by the terms and provision of this agreement.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. Emergency Services</Text>
        <Text style={styles.paragraph}>The application provides emergency response services. Users acknowledge that response times may vary based on location, traffic, and other factors beyond our control.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. User Responsibilities</Text>
        <Text style={styles.paragraph}>Users must provide accurate information and use the service responsibly. False emergency reports may result in legal consequences.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. Privacy Policy</Text>
        <Text style={styles.paragraph}>We collect and process personal data in accordance with our Privacy Policy. By using the app, you consent to such processing.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>5. Limitation of Liability</Text>
        <Text style={styles.paragraph}>Pahilo Uddhar is not liable for any direct, indirect, incidental, or consequential damages resulting from the use of our services.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
  },
});