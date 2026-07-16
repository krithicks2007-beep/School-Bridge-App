import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

class NotificationService {
  async initializeNotifications() {
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
  }

  async setBadgeCount(count) {
    try {
      // Updates the launcher badge count using the total unread items
      // (announcements, homework, messages, etc.) where supported by the Android launcher.
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      // Gracefully handle devices that do not support launcher badges.
      console.log('Badge setting is not supported on this device/launcher', error);
    }
  }

  async registerForPushNotificationsAsync() {
    let token;

    if (Device.isDevice) {
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
      try {
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
        console.log('Error getting push token:', e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }
}

export default new NotificationService();
