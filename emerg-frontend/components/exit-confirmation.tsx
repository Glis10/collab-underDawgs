import { useEffect } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';

export function ExitConfirmation() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Exit app?', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'android') {
              BackHandler.exitApp();
            }
          },
        },
      ]);

      return true;
    });

    return () => subscription.remove();
  }, []);

  return null;
}
