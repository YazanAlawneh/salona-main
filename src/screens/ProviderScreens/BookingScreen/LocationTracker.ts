// src/screens/providerscreens/Booking/LocationTracker.ts
// ------------------------------------------------------
// Lightweight, self‑contained background‑location helper.
//
// ▶  Depends on two native libs:
//      yarn add react-native-geolocation-service react-native-background-actions
// ▶  Android‑only "always on" tracking; iOS suspends after ~30 s without
//    native additions.
//
// Usage inside any screen / slice:
//      import { startLocationTracking, stopLocationTracking } from './LocationTracker';
//
//      useEffect(() => {
//        startLocationTracking({ userId: user.id, token });
//        return stopLocationTracking;               // cleanup on unmount
//      }, [user.id, token]);
//
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import BackgroundJob, { BackgroundTaskOptions } from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import { useTranslation } from '../../../contexts/TranslationContext';  
/* ╔════════════════════ CONFIG ═══════════════════════════════╗ */
const POLL_INTERVAL = 15_000;         // 15 seconds
const LOCATION_TIMEOUT = 10_000;      // 10 seconds
const BACKEND_URL =
  'https://bella-glam.com/api/update-salon-address';     // Updated to new API URL
/* ╚═══════════════════════════════════════════════════════════╝ */

/* ────────────────────────── PERMISSIONS ────────────────────────── */
async function requestAllPermissions(): Promise<boolean> {
  const permissions = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  ];
  const {t} = useTranslation();
  // Request foreground permissions first
  const granted = await PermissionsAndroid.requestMultiple(permissions);
  const allForegroundGranted = permissions.every(
    perm => granted[perm] === PermissionsAndroid.RESULTS.GRANTED
  );
  if (!allForegroundGranted) return false;

  // Android 11+ requires background location as a second prompt
  if (Platform.OS === 'android' && Platform.Version >= 30) {
    const bg = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
    );
    if (bg !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  return true;
}

/* ────────────────────────── BACKGROUND TASK ───────────────────── */
const getCurrentPosition = () =>
  new Promise<Geolocation.GeoPosition>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error),
      { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT, maximumAge: 10000 }
    );
  });

const trackingTask = async (taskData: any) => {
  const { delay, userId, token } = taskData;
  await new Promise<void>((resolve) => {
    const intervalId = setInterval(async () => {
      if (!BackgroundJob.isRunning()) {
        clearInterval(intervalId);
        resolve();
        return;
      }
      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        console.log('Current Position:', position);
        await BackgroundJob.updateNotification({
          taskDesc: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
        });
        // Optionally: send to backend
        if (userId && token) {
          try {
            await fetch(BACKEND_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ id: userId, latitude, longitude }),
            });
          } catch (err) {
            if (__DEV__) console.warn('[LocationTracker] POST failed', err);
          }
        }
      } catch (error) {
        console.log('Geolocation error:', error);
      }
      // Wait for delay before next poll
      await new Promise(r => setTimeout(r, delay));
    }, delay);
  });
};

const options: BackgroundTaskOptions = {
  taskName: 'Geolocation Task',
  taskTitle: 'Location tracking enabled',
  taskDesc: 'Your location is being sent to Spa provider portal.',
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: '#ECB045',
};

/* ────────────────────────── PUBLIC API ───────────────────────── */
let isInitialised = false;

export async function startLocationTracking({ userId, token }: { userId: number; token: string }): Promise<void> {
  if (isInitialised) return;
  const granted = await requestAllPermissions();
  if (!granted) {
    Alert.alert('Permission denied', 'Location permission is required to update your salon position.');
    return;
  }
  try {
    const dynamicOptions: BackgroundTaskOptions = {
      taskName: 'Geolocation Task',
      taskTitle: 'Location tracking enabled',
      taskDesc: 'Your location is being sent to Spa provider portal.',
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#ECB045',
      parameters: { delay: POLL_INTERVAL, userId, token },
    };
    await BackgroundJob.start(trackingTask as any, dynamicOptions);
    isInitialised = true;
    if (__DEV__) console.log('[LocationTracker] started');
  } catch (err) {
    console.error('[LocationTracker] failed to start:', err);
  }
}

export async function stopLocationTracking(): Promise<void> {
  if (!isInitialised) return;
  try {
    await BackgroundJob.stop();
    if (__DEV__) console.log('[LocationTracker] stopped');
  } finally {
    isInitialised = false;
  }
}
