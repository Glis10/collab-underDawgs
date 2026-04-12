import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="UserSignIn" />
      <Stack.Screen name="AdminSignIn" />
      <Stack.Screen name="SignUp" />
      <Stack.Screen name="ForgotPassword" />
      <Stack.Screen name="OtpVerification" />
      <Stack.Screen name="ResetPassword" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="Terms" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
