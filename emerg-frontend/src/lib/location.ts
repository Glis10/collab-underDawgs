import * as Location from 'expo-location';
import { EmergencyLocation } from '@/src/lib/auth';

export async function getCurrentEmergencyLocation(): Promise<EmergencyLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Location permission is required to share your emergency location.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
    mayShowUserSettingsDialog: true,
  });

  return {
    latitude: position.coords.latitude.toString(),
    longitude: position.coords.longitude.toString(),
  };
}

export async function getOptionalCurrentEmergencyLocation(): Promise<EmergencyLocation | null> {
  try {
    return await getCurrentEmergencyLocation();
  } catch {
    return null;
  }
}
