import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppPreferences } from '@/src/lib/app-preferences';
import { forgotPassword, getCurrentUser } from '@/src/lib/auth';

const RED = '#E63946';
const NAVY = '#1A365D';
const BORDER = '#E2E8F0';
const settingsRoute = '/settings' as Href;

const steps = ['passwordHelpOne', 'passwordHelpTwo', 'passwordHelpThree'] as const;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const { darkMode, t } = useAppPreferences();
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async () => {
    const nextEmail = email.trim();

    if (!nextEmail) {
      Alert.alert('Missing email', 'Please enter your linked email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await forgotPassword(nextEmail);
      router.push({
        pathname: '/OtpVerification',
        params: {
          email: nextEmail,
          userId: response.userId,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send OTP right now.';
      Alert.alert('Request failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity style={[styles.backButton, darkMode && styles.cardDark]} onPress={() => router.replace(settingsRoute)}>
              <Ionicons name="chevron-back" size={22} color={darkMode ? '#FFFFFF' : NAVY} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, darkMode && styles.textDark]}>{t('changePasswordTitle')}</Text>
              <Text style={styles.subtitle}>{t('changePasswordSubtitle')}</Text>
            </View>
          </View>

          <View style={[styles.card, darkMode && styles.cardDark]}>
            <View style={styles.lockIcon}>
              <MaterialCommunityIcons name="lock-reset" size={34} color={RED} />
            </View>

            <Text style={[styles.label, darkMode && styles.textDark]}>{t('linkedEmail')}</Text>
            <View style={[styles.inputWrap, darkMode && styles.inputWrapDark]}>
              <MaterialCommunityIcons name="at" size={20} color="#718096" />
              <TextInput
                style={[styles.input, darkMode && styles.textDark]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="name@example.com"
                placeholderTextColor={darkMode ? '#9CA3AF' : '#A0AEC0'}
              />
            </View>

            <View style={styles.stepList}>
              {steps.map((step, index) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, darkMode && styles.mutedTextDark]}>{t(step)}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]} onPress={handleSendOtp} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{t('sendOtp')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace(settingsRoute)}>
              <Text style={styles.secondaryButtonText}>{t('backToSettings')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7FAFC',
    flex: 1,
  },
  containerDark: {
    backgroundColor: '#050505',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: NAVY,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  cardDark: {
    backgroundColor: '#121212',
    borderColor: '#2A2A2A',
  },
  lockIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: 8,
    height: 58,
    justifyContent: 'center',
    marginBottom: 18,
    width: 58,
  },
  label: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderColor: BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  inputWrapDark: {
    backgroundColor: '#050505',
    borderColor: '#2A2A2A',
  },
  input: {
    color: '#111827',
    flex: 1,
    fontSize: 15,
  },
  stepList: {
    gap: 12,
    marginVertical: 20,
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepNumberText: {
    color: RED,
    fontSize: 13,
    fontWeight: '900',
  },
  stepText: {
    color: '#4B5563',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: RED,
    fontSize: 14,
    fontWeight: '800',
  },
  textDark: {
    color: '#F9FAFB',
  },
  mutedTextDark: {
    color: '#CBD5E1',
  },
});
