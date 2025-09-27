import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppRegistry, Alert } from 'react-native';
import { store } from '../redux/store';
import { incrementNotifications, updateUser, setNotifications } from '../redux/slices/userSlice';
import navigationService from './navigationService';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKplQEnueX8njxb1Si1Zc7tLMn5mp-deM",
  authDomain: "spa1-46f3d.firebaseapp.com",
  databaseURL: "https://spa1-46f3d-default-rtdb.firebaseio.com",
  projectId: "spa1-46f3d",
  storageBucket: "spa1-46f3d.firebasestorage.app",
  messagingSenderId: "218571464302",
  appId: "1:218571464302:web:f501f4a1c6d6941e61907f",
  measurementId: "G-XHCYGWWCKS"
};

// Define the background handler task
const backgroundMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  console.log('back message', remoteMessage);

  // Increment notification count in Redux
  const currentNumberOfNotifications = store.getState().user.numberOfNotifications;
  store.dispatch(updateUser({ numberOfNotifications: currentNumberOfNotifications + 1 }));
  
  console.log('Message handled in the background!', remoteMessage);
  
  return Promise.resolve();
};

// Register the background handler
messaging().setBackgroundMessageHandler(backgroundMessageHandler);

// Register the headless task
AppRegistry.registerHeadlessTask('ReactNativeFirebaseMessagingHeadlessTask', () => backgroundMessageHandler);

// Request permission for notifications
export const requestUserPermission = async () => {
  try {
    console.log('📱 Checking notification permission status...');
    
    // For Android, we need to request both foreground and background permissions
    if (Platform.OS === 'android') {
      // Request foreground notification permissions
      const authStatus = await messaging().requestPermission({
        sound: true,
        alert: true,
        badge: true,
        provisional: false,
      });
      
      console.log('🔐 Authorization status:', authStatus);
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (enabled) {
        // Enable auto-initialization for background notifications
        await messaging().setAutoInitEnabled(true);
        
        // Request background notification permissions
        // This is a no-op on iOS but important for Android
        await messaging().requestPermission({
          sound: true,
          alert: true,
          badge: true,
          provisional: false,
          announcement: true,
        });
      }
      
      console.log('📢 Notifications enabled?', enabled);
      return enabled;
    } else {
      // For iOS, the standard permission request is sufficient
      const authStatus = await messaging().requestPermission({
        sound: true,
        alert: true,
        badge: true,
        provisional: false,
      });
      
      console.log('🔐 Authorization status:', authStatus);
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      console.log('📢 Notifications enabled?', enabled);
      return enabled;
    }
  } catch (error) {
    console.error('❌ Error requesting permission:', error);
    return false;
  }
};

// Get FCM token
export const getFCMToken = async () => {
  try {
    console.log('🔍 Starting FCM token retrieval process...');
    
    // Check if permission is granted first
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      console.error('❌ Cannot get FCM token - no permission');
      return null;
    }

    // Get the token
    console.log('📤 Requesting new FCM token...');
    const fcmToken = await messaging().getToken();
    
    if (fcmToken) {
      console.log('✅ FCM Token retrieved successfully');
      console.log('🔑 TOKEN:', fcmToken);
      console.log('📋 Token length:', fcmToken.length);
      return fcmToken;
    } else {
      console.error('❌ Failed to get FCM token - token is null');
      return null;
    }
  } catch (error) {
    console.error('❌ Error in getFCMToken:', error);
    return null;
  }
};

// Listen for token refresh
export const setupTokenRefreshListener = () => {
  console.log('🔄 SETTING UP TOKEN REFRESH LISTENER');
  messaging().onTokenRefresh(async (fcmToken) => {
    console.log('🔄 FCM TOKEN REFRESHED:', fcmToken);
    await AsyncStorage.setItem('fcmToken', fcmToken);
    console.log('💾 REFRESHED TOKEN SAVED TO STORAGE');
    // Here you would typically send the new token to your backend
    sendTokenToBackend(fcmToken);
  });
};

// Setup notification handlers
export const setupNotificationHandlers = () => {
  // Handle notifications when app is in foreground
  messaging().onMessage(async remoteMessage => {
    console.log('📱 Received foreground message:', JSON.stringify(remoteMessage, null, 2));
    
    try {
      if (remoteMessage.notification) {
        // Show an alert for foreground notifications
        Alert.alert(
          remoteMessage.notification.title || 'New Notification',
          remoteMessage.notification.body || '',
          [
            {
              text: 'View',
              onPress: () => {
                // Handle navigation if needed
                if (remoteMessage.data && remoteMessage.data.screen) {
                  const { screen } = remoteMessage.data;
                  let params = {};
                  
                  if (remoteMessage.data.params) {
                    if (typeof remoteMessage.data.params === 'string') {
                      try {
                        params = JSON.parse(remoteMessage.data.params);
                      } catch (e) {
                        console.error('Error parsing params:', e);
                      }
                    } else if (typeof remoteMessage.data.params === 'object') {
                      params = remoteMessage.data.params;
                    }
                  }
                  
                  console.log('Navigation params:', params);
                  
                  // Navigate to the specified screen
                  navigationService.navigate(screen as string, params);
                }
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );

        console.log('📬 Notification content:', {
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body
        });
      }
    } catch (error) {
      console.error('❌ Error handling notification:', error);
    }
  });

  // Handle notification open events
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('🔔 Notification opened app from background state:', remoteMessage);
    
    // Handle navigation if needed
    if (remoteMessage.data && remoteMessage.data.screen) {
      const { screen } = remoteMessage.data;
      let params = {};
      
      if (remoteMessage.data.params) {
        if (typeof remoteMessage.data.params === 'string') {
          try {
            params = JSON.parse(remoteMessage.data.params);
          } catch (e) {
            console.error('Error parsing params:', e);
          }
        } else if (typeof remoteMessage.data.params === 'object') {
          params = remoteMessage.data.params;
        }
      }
      
      console.log('Navigation params:', params);
      
      // Navigate to the specified screen
      navigationService.navigate(screen as string, params);
    }
  });

  // Check if app was opened from a notification
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('🔔 App opened from quit state by notification:', remoteMessage);
        
        // Handle navigation if needed
        if (remoteMessage.data && remoteMessage.data.screen) {
          const { screen } = remoteMessage.data;
          let params = {};
          
          if (remoteMessage.data.params) {
            if (typeof remoteMessage.data.params === 'string') {
              try {
                params = JSON.parse(remoteMessage.data.params);
              } catch (e) {
                console.error('Error parsing params:', e);
              }
            } else if (typeof remoteMessage.data.params === 'object') {
              params = remoteMessage.data.params;
            }
          }
          
          console.log('Navigation params:', params);
          
          // Navigate to the specified screen
          navigationService.navigate(screen as string, params);
        }
      }
    });

  console.log('✅ Notification handlers setup complete');
};

// Send token to backend
export const sendTokenToBackend = async (token: string) => {
  try {
    // Get the auth token from storage
    const authToken = await AsyncStorage.getItem('token');
    if (!authToken) {
      console.log('No auth token found, cannot send FCM token to backend');
      return false;
    }

    // Send the token to your backend
    const response = await fetch('https://bella-glam.com/api/users/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ fcm_token: token })
    });

    const data = await response.json();
    console.log('FCM token sent to backend:', data);
    return true;
  } catch (error) {
    console.error('Error sending FCM token to backend:', error);
    return false;
  }
};

// Initialize Firebase
export const initializeFirebase = async () => {
  try {
    console.log('🚀 INITIALIZING FIREBASE...');
    
    // Initialize notification count from AsyncStorage
    try {
      const storedCount = await AsyncStorage.getItem('numberOfNotifications');
      if (storedCount !== null) {
        const count = parseInt(storedCount, 10);
        store.dispatch(setNotifications(count));
        console.log('📬 Loaded notification count from storage:', count);
      }
    } catch (error) {
      console.error('❌ Error loading notification count:', error);
    }
    
    // Request permission and get token
    const token = await getFCMToken();
    // if (token) {
    //   console.log('✅ FCM TOKEN OBTAINED:', token);
    //   // Send token to backend
    //   const sent = await sendTokenToBackend(token);
    //   if (sent) {
    //     console.log('✅ FCM TOKEN SENT TO BACKEND');
    //   } else {
    //     console.log('❌ FAILED TO SEND FCM TOKEN TO BACKEND');
    //   }
    // } else {
    //   console.log('❌ NO FCM TOKEN AVAILABLE');
    // }

    // Setup token refresh listener
    setupTokenRefreshListener();

    // Setup notification handlers
    setupNotificationHandlers();

    console.log('✅ FIREBASE INITIALIZED SUCCESSFULLY');
    return true;
  } catch (error) {
    console.error('❌ ERROR INITIALIZING FIREBASE:', error);
    return false;
  }
};

export default {
  firebaseConfig,
  requestUserPermission,
  getFCMToken,
  setupTokenRefreshListener,
  setupNotificationHandlers,
  sendTokenToBackend,
  initializeFirebase
}; 