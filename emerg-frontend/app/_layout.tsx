import React, { useEffect, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import { AppPreferencesProvider } from '@/src/lib/app-preferences';
import { ExitConfirmation } from '@/components/exit-confirmation';
import { AiChatAssistant } from '@/components/ai-chat-assistant';
import { getAuthRevision, getCurrentUser, subscribeAuthChanges } from '@/src/lib/auth';

const stackScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
};

const userAssistantRoutes = ['/dashboard', '/service-request', '/track-request', '/contacts', '/settings', '/change-password'];

export default function RootLayout() {
  const pathname = usePathname();
  const [, setAuthRevision] = useState(getAuthRevision);
  const currentUser = getCurrentUser();
  const isUserSideRoute = userAssistantRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const showAssistant = isUserSideRoute && currentUser?.role !== 'admin';

  useEffect(() => subscribeAuthChanges(() => setAuthRevision(getAuthRevision())), []);

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
      {showAssistant ? <AiChatAssistant /> : null}
    </AppPreferencesProvider>
  );
}
