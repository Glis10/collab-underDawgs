import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerNotificationToken } from '@/src/lib/auth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId() {
  return Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
}

export async function registerCurrentDeviceForPushNotifications() {
  if (Platform.OS === 'web') {
    return null;
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;

  if (finalStatus !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId = getExpoProjectId();
  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const pushToken = tokenResponse.data;

  await registerNotificationToken(pushToken);
  return pushToken;
}

export function subscribeToNotificationResponses(onResponse?: (data: Record<string, unknown>) => void) {
  const receivedSubscription = Notifications.addNotificationReceivedListener(() => undefined);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse?.(response.notification.request.content.data as Record<string, unknown>);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
