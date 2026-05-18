import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
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
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { verifyRegistration } from '@/src/lib/auth';

const OTP_LENGTH = 6;

export default function OtpVerificationScreen() {
  const router = useRouter();
  const { email, userId, mode } = useLocalSearchParams<{ email?: string; userId?: string; mode?: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');

    if (!sanitizedValue) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    const nextOtp = [...otp];
    const digits = sanitizedValue.slice(0, OTP_LENGTH - index).split('');

    digits.forEach((digit, digitOffset) => {
      nextOtp[index + digitOffset] = digit;
    });

    setOtp(nextOtp);

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') {
      return;
    }

    if (otp[index]) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      const nextOtp = [...otp];
      nextOtp[index - 1] = '';
      setOtp(nextOtp);
    }
  };

  const handleVerifyOtp = async () => {
    if (!userId) {
      Alert.alert('Missing verification details', 'Please request a new OTP and try again.');
      return;
    }

    const otpToken = otp.join('');

    if (otpToken.length !== OTP_LENGTH) {
      Alert.alert('Incomplete OTP', 'Please enter the full 6-digit OTP code.');
      return;
    }

    if (mode === 'registration') {
      try {
        setIsSubmitting(true);
        await verifyRegistration(userId, otpToken);
        router.replace('/dashboard' as Href);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to verify OTP right now.';
        Alert.alert('Verification failed', message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    router.push({
      pathname: '/ResetPassword',
      params: {
        otpToken,
        userId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Image
        source={require('../assets/auth-top.png')}
        style={styles.topImage}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.header}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {email || 'your email address'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Enter OTP</Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  textAlign="center"
                  placeholder="0"
                  placeholderTextColor="#A0AEC0"
                  returnKeyType="done"
                />
              ))}
            </View>

            <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleVerifyOtp} disabled={isSubmitting}>
              <Text style={styles.buttonText}>{isSubmitting ? 'Verifying...' : 'Verify OTP'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendLinkContainer}>
              <Text style={styles.resendText}>Didn&apos;t receive the code? Resend OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLinkContainer} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Image
        source={require('../assets/auth-bottom.png')}
        style={styles.bottomImage}
        resizeMode="cover"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topImage: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 150,
  },
  bottomImage: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 150,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 150,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: '70%',
    maxWidth: 200,
    height: 60,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '400',
    color: '#1a365d',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  otpInput: {
    width: '14%',
    minWidth: 44,
    maxWidth: 52,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    color: '#2D3748',
    fontSize: 22,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendLinkContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: '#E63946',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  backLinkContainer: {
    alignItems: 'center',
  },
  backLinkText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
  },
});
