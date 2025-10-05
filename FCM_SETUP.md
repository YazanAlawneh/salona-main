# Firebase Cloud Messaging (FCM) Setup

This document provides instructions for setting up Firebase Cloud Messaging (FCM) in the Spa application.

## Overview

Firebase Cloud Messaging (FCM) is used to send push notifications to users of the Spa application. This document explains how to:

1. Get the FCM token from the mobile app
2. Send the token to your backend
3. Use the token to send push notifications

## Getting the FCM Token

The FCM token is automatically generated when the app starts and is stored in the device's local storage. You can access the token through the FCM Token screen in the app:

1. Open the Spa app
2. Go to the Account screen
3. Scroll down to the "Developer Tools" section
4. Tap on "FCM Token (For Testing)"
5. The FCM token will be displayed on the screen
6. You can tap "Send to Backend" to send the token to your backend server

## Sending the Token to Your Backend

The app automatically sends the FCM token to your backend when:

1. The app is first launched
2. The user logs in
3. The token is refreshed (which happens periodically)

The token is sent to the following endpoint:

```
POST https://bella-glam.com/api/users/fcm-token
```

With the following request body:

```json
{
  "fcm_token": "YOUR_FCM_TOKEN"
}
```

And the following headers:

```
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json
```

## Using the Token to Send Push Notifications

To send push notifications to a specific user, you need to:

1. Retrieve the user's FCM token from your database
2. Use the Firebase Admin SDK to send a notification to that token

Here's an example of how to send a notification using the Firebase Admin SDK in Node.js:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Send a notification to a specific user
const sendNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

// Example usage
sendNotification(
  'USER_FCM_TOKEN',
  'Appointment Confirmed',
  'Your appointment has been confirmed for tomorrow at 2:00 PM',
  {appointmentId: '123', type: 'appointment_confirmation'},
);
```

## Important Notes

1. **Token Changes**: FCM tokens can change over time. The app handles this by:

   - Storing the token in local storage
   - Listening for token refresh events
   - Sending the new token to your backend when it changes

2. **Multiple Devices**: A user may have multiple devices. Each device will have its own FCM token. Make sure to store all tokens associated with a user in your database.

3. **Testing**: Use the FCM Token screen in the app to test your notification setup. You can manually send the token to your backend and then send a test notification.

4. **Error Handling**: If a notification fails to send, it could be because:
   - The token is invalid or expired
   - The user has uninstalled the app
   - The user has disabled notifications

## Troubleshooting

If you're having issues with FCM:

1. Check that the FCM token is being correctly sent to your backend
2. Verify that your Firebase Admin SDK is properly configured
3. Check the Firebase Console for any error messages
4. Test sending a notification using the Firebase Console

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
