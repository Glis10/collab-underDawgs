import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { loginUser } from '@/src/lib/auth';

const dashboardRoute = '/dashboard' as Href;

export default function AdminSignInScreen() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminSignIn = async () => {
    if (!phoneNumber.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your phone number and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await loginUser({
        phoneNumber: phoneNumber.trim(),
        password,
      });

      if (response.user.role !== 'admin') {
        Alert.alert('Access denied', 'This account is not registered as an admin.');
        return;
      }

      router.replace(dashboardRoute);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      Alert.alert('Sign in failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Image 
        source={require('../assets/auth-top.png')} 
        style={styles.topImage}
        resizeMode="cover"
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.header}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.titleSerif}>Admin</Text>
            <Text style={styles.titleSerif}>Sign In</Text>
            <Text style={styles.subtitle}>Sign in as admin</Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/UserSignIn')} style={styles.switchContainer}>
            <Text style={styles.switchText}>Switch to User Sign In</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="phone" size={20} color="#718096" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholderTextColor="#A0AEC0"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock" size={20} color="#718096" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#A0AEC0"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#718096" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={() => router.push('/ForgotPassword')}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleAdminSignIn} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>{"Don't have an account? "}</Text>
              <TouchableOpacity onPress={() => router.push('/SignUp')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 150,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: '70%',
    maxWidth: 200,
    height: 60,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  titleSerif: {
    fontSize: 42,
    fontWeight: '400',
    color: '#1a365d',
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
  },
  switchContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  switchText: {
    color: '#E63946',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 12,
    height: 56,
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#2D3748',
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#E63946',
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#718096',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: '#E63946',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
