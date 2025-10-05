// import BackgroundJob from 'react-native-background-actions';
// import Geolocation from 'react-native-geolocation-service';

// const sendLocationToBackend = async (latitude: number, longitude: number, token: string) => {
//   try {
//     await fetch('https://bella-glam.com/api/update-salon-address', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ latitude, longitude }),
//     });
//     console.log('Salon location updated:', latitude, longitude);
//   } catch (error) {
//     console.error('Failed to update salon location:', error);
//   }
// };

// const backgroundTask = async (taskData: any) => {
//   const { token } = taskData;
//   await new Promise<void>((resolve) => {
//     const intervalId = setInterval(() => {
//       if (!BackgroundJob.isRunning()) {
//         clearInterval(intervalId);
//         resolve();
//         return;
//       }
//       Geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           sendLocationToBackend(latitude, longitude, token);
//         },
//         (error) => {
//           console.log('Geolocation error:', error.code, error.message);
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//       );
//     }, 180000); // every 3 minutes
//   });
// };

// const options = {
//   taskName: 'SalonLocation',
//   taskTitle: 'Updating Salon Location',
//   taskDesc: 'Your salon location is being updated in the background.',
//   taskIcon: {
//     name: 'ic_launcher',
//     type: 'mipmap',
//   },
//   color: '#ff00ff',
//   parameters: {},
// };

// export const startSalonLocationBackgroundTask = async (token: string) => {
//   try {
//     await BackgroundJob.start(backgroundTask, { ...options, parameters: { token } });
//     console.log('Background location service started!');
//   } catch (e) {
//     console.log('Error starting background service:', e);
//   }
// };

// export const stopSalonLocationBackgroundTask = async () => {
//   try {
//     await BackgroundJob.stop();
//     console.log('Background location service stopped!');
//   } catch (e) {
//     console.log('Error stopping background service:', e);
//   }
// };
