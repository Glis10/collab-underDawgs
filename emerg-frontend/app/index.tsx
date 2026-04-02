import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function LandingScreen() {
  const router = useRouter(); // <-- New: Expo Router hook!

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Image 
        source={require('../assets/auth-top.png')} // path updated for app/ directory
        style={styles.topImage}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.spacer} />

        <Text style={styles.subtitle}>Continue as User or Admin</Text>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/UserSignIn')} // <-- New: router.push path!
        >
          <Text style={styles.primaryButtonText}>User Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/AdminSignIn')} // <-- New: router.push path!
        >
          <Text style={styles.secondaryButtonText}>Admin Sign In</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 60,
  },
  spacer: {
    height: 100,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 24,
    fontWeight: 'bold',
    fontFamily: 'System', // or your loaded custom font
  },
  primaryButton: {
    backgroundColor: '#E63946',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E63946',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#E63946',
    fontSize: 16,
    fontWeight: '600',
  },
});
