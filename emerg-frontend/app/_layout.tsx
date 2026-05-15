import { Stack } from 'expo-router';
import { AppPreferencesProvider } from '@/src/lib/app-preferences';
import { ExitConfirmation } from '@/components/exit-confirmation';

const stackScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
};

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <ExitConfirmation />
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="UserSignIn" />
        <Stack.Screen name="AdminSignIn" />
        <Stack.Screen name="SignUp" />
        <Stack.Screen name="ForgotPassword" />
        <Stack.Screen name="OtpVerification" />
        <Stack.Screen name="ResetPassword" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="service-request" />
        <Stack.Screen name="track-request" />
        <Stack.Screen name="contacts" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="admin-change-password" />
        <Stack.Screen name="admin-dashboard" />
        <Stack.Screen name="Terms" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </AppPreferencesProvider>
  );
}
