import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

let Notifications = null;
try {
  // expo-notifications push functionality was removed from Expo Go in SDK 53+.
  // Loading it dynamically prevents crashing Expo Go on Android at startup.
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('[NotificationService] Notifications unavailable in Expo Go environment:', e.message);
}

class NotificationService {
  async initializeNotifications() {
    if (Platform.OS === 'web' || !Notifications) return false;
    try {
      // Configure how notifications are handled when the app is in the foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      if (Platform.OS === 'android') {
        const channels = [
          { id: 'announcements', name: 'Announcements', importance: Notifications.AndroidImportance.MAX },
          { id: 'homework', name: 'Homework', importance: Notifications.AndroidImportance.HIGH },
          { id: 'marks', name: 'Marks', importance: Notifications.AndroidImportance.HIGH },
          { id: 'transport', name: 'Transport', importance: Notifications.AndroidImportance.HIGH },
          { id: 'fees', name: 'Fees', importance: Notifications.AndroidImportance.HIGH },
          { id: 'events', name: 'Events', importance: Notifications.AndroidImportance.HIGH },
        ];

        for (const channel of channels) {
          await Notifications.setNotificationChannelAsync(channel.id, {
            name: channel.name,
            importance: channel.importance,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
      
      return true;
    } catch (err) {
      console.log('Notification initialization skipped:', err.message);
      return false;
    }
  }

  async setBadgeCount(count) {
    if (Platform.OS === 'web' || !Notifications) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.log('Badge setting is not supported on this device/launcher', error);
    }
  }

  async registerForPushNotificationsAsync() {
    if (Platform.OS === 'web' || !Notifications) return null;
    let token;

    if (Device.isDevice) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return null;
        }
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          console.log('Project ID not found');
        }
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
      } catch (e) {
        console.log('Error getting push token:', e.message);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }
}

export default new NotificationService();
