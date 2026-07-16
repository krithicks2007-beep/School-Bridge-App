const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

const sendPushNotification = async (pushTokens, title, body, data = {}) => {
  if (!pushTokens || pushTokens.length === 0) return;

  let messages = [];
  for (let pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      badge: 1, // Triggers the red badge on the app icon
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push tickets:', ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }
};

module.exports = {
  sendPushNotification,
};
