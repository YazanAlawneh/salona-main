import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
  StatusBar,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import styles from './Booking.styles';
import BookingCard from '../../../components/BookingCard/BookingCard';
import {useNavigation, useRoute} from '@react-navigation/native';
import ProviderFooter from '../../../components/ProviderFooter/ProviderFooter';
import {useSelector} from 'react-redux';
import {RootState} from '../../../redux/store';
import {
  useGetAppointmentsQuery,
  useMarkAppointmentAsReadMutation,
} from '../../../redux/api/salonApi';
import {Appointment} from '../../../types/salon';
import {useTranslation} from '../../../contexts/TranslationContext';
import Geolocation from 'react-native-geolocation-service';
import {useLocation} from '../../userscreens/EditLocation/hooks/useLocation';
import messaging from '@react-native-firebase/messaging';
import {format} from 'date-fns';
import {arSA} from 'date-fns/locale';

const ProviderBookings = () => {
  const {user, token} = useSelector((state: RootState) => state.auth);
  const salonId = user?.id;
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialTab = (route.params && (route.params as any).initialTab) as
    | 'booked'
    | 'completed'
    | 'cancelled'
    | undefined;
  const [activeTab, setActiveTab] = useState<
    'booked' | 'completed' | 'cancelled'
  >(initialTab || 'booked');
  const {data, isLoading, error, refetch} = useGetAppointmentsQuery({
    status: activeTab,
  });
  const {getCurrentLocation, requestLocationPermission} = useLocation();
  const {t, isRTL} = useTranslation();
  const [markAsRead] = useMarkAppointmentAsReadMutation();

  // Refetch appointments when activeTab changes
  useEffect(() => {
    refetch();
  }, [activeTab, refetch]);

  const requestUserPermission = async () => {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      } else {
        console.log('Notification permission not granted');
      }
    } else {
      // For Android, just request the permission directly without custom dialog
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
      }
    }
  };

  useEffect(() => {
    requestLocationPermission().then(granted => {
      if (granted) {
        getCurrentLocation()
          .then(location => {
            console.log(
              'Provider current location:',
              location.latitude,
              location.longitude,
            );
            // Send location to backend
            if (user && user.id && token) {
              const payload = {
                id: user.id,
                latitude: location.latitude,
                longitude: location.longitude,
              };
              const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              };
              console.log('📤 Sending salon location update:', {
                url: 'https://bella-glam.com/api/update-salon-address',
                headers,
                payload,
              });
              fetch('https://bella-glam.com/api/update-salon-address', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
              })
                .then(async response => {
                  const text = await response.text();
                  let data;
                  try {
                    data = JSON.parse(text);
                  } catch (e) {
                    data = text;
                  }
                  if (response.ok) {
                    console.log('✅ Salon location update successful:', data);
                  } else {
                    console.error('❌ Salon location update failed:', {
                      status: response.status,
                      statusText: response.statusText,
                      data,
                    });
                  }
                })
                .catch(error => {
                  console.error('❌ Error updating salon location:', error);
                });
            }
          })
          .catch(err => {
            console.log('Error getting location:', err);
          });
      } else {
        console.warn('Location permissions not granted');
      }
    });

    // Add notification permission request
    requestUserPermission();
  }, [user]);

  console.log('API Response:', {data, isLoading, error});
  console.log('User ID:', salonId);

  const filteredAppointments = useMemo(() => {
    if (!data?.appointments) return [];

    return [...data.appointments].sort((a, b) => {
      // First sort by read status (unread first)
      if (a.is_read !== b.is_read) {
        return a.is_read - b.is_read;
      }

      // Then sort by date in descending order
      const dateA = new Date(`${a.appointment_day} ${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_day} ${b.appointment_time}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [data?.appointments]);

  // console.log('Filtered Appointments:', filteredAppointments);
  console.log('Active Tab:', activeTab);
  // console.log('Filtered Appointments:', filteredAppointments);

  // Add detailed logging for completed appointments
  if (activeTab === 'completed') {
    console.log('=== COMPLETED APPOINTMENTS DETAILS ===');
    console.log('Total appointments:', data?.appointments.length || 0);
    console.log('Completed appointments count:', filteredAppointments.length);

    // Log each completed appointment with detailed information
    filteredAppointments.forEach((appointment, index) => {
      console.log(`\nAppointment #${index + 1}:`);
      console.log('ID:', appointment.id);
      console.log('Date:', appointment.appointment_day);
      console.log('Time:', appointment.appointment_time);
      console.log('Total Amount:', appointment.total_amount);
      console.log('Is Read:', appointment.is_read);
      console.log('Salon:', {
        id: appointment.salon.id,
        name: appointment.salon.name,
        image: appointment.salon.image_url,
      });
      console.log(
        'Services:',
        appointment.services.map(service => ({
          id: service.id,
          name: service.service,
          price: service.price,
          duration: service.time,
        })),
      );
    });

    console.log('\n=== END COMPLETED APPOINTMENTS DETAILS ===');
  }

  const handleDetailPress = async (bookingId: number) => {
    const appointment = data?.appointments.find(app => app.id === bookingId);

    if (!appointment) {
      console.error('Appointment not found with ID:', bookingId);
      return;
    }

    try {
      // Mark appointment as read if it's unread
      if (appointment.is_read === 0) {
        await markAsRead(bookingId).unwrap();
      }

      console.log('Navigating to ReviewBooking with appointment:', appointment);

      navigation.navigate('ProviderReviewBookingScreen', {
        bookingDetails: appointment,
        isCompleted: activeTab === 'completed',
      });
    } catch (error) {
      console.error('Error marking appointment as read:', error);
      // Still navigate even if marking as read fails
      navigation.navigate('ProviderReviewBookingScreen', {
        bookingDetails: appointment,
        isCompleted: activeTab === 'completed',
      });
    }
  };

  const renderBookingCard = ({item}: {item: Appointment}) => {
    const [year, month, day] = item.appointment_day.split('-');
    const [hours, minutes] = item.appointment_time.split(':');
    const formattedDate = `${day}/${month}/${year}`;
    // const formattedTime = `${hours}:${minutes}`;
    const servicesCount = item.services.length;
    const serviceNames = item.services
      .map(service => service.service)
      .join(', ');

    // Combine date and time into a single ISO string
    const dateTimeString = `${item.appointment_day}T${item.appointment_time}`;
    let formattedTime = `${item.appointment_day} at ${item.appointment_time}`;
    try {
      const dateObj = new Date(dateTimeString);
      const formattedDate = format(dateObj, 'MMMM d, yyyy', {
        locale: isRTL ? arSA : undefined,
      });
      const formattedHour = format(dateObj, 'hh:mm a', {
        locale: isRTL ? arSA : undefined,
      });
      const dayName = format(dateObj, 'EEEE', {
        locale: isRTL ? arSA : undefined,
      });
      formattedTime = `${formattedDate} (${dayName}) ${
        t.bookings.details.time || 'at'
      } ${formattedHour}`;
    } catch (e) {
      // fallback to original
    }
    return (
      <BookingCard
        image={require('../../../assets/images/prettyLogo.png')}
        name={serviceNames || 'No services selected'}
        servicesCount={servicesCount}
        price={`${item.total_amount} JDs`}
        time={formattedTime}
        onDetailPress={() => handleDetailPress(item.id)}
        isRead={item.is_read === 1}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.loadingText}>{t.providerBookings.loading}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ImageBackground
        source={require('../../../assets/images/pink-bg.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.providerBookings.title}</Text>
        </View>

        <View style={[styles.tabContainer]}>
          {(['booked', 'completed', 'cancelled'] as const).map(tab => {
            // Calculate unread count for each tab
            const tabUnreadCount =
              data?.appointments?.filter(
                app => app.is_read === 0 && app.status === tab,
              ).length || 0;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}>
                <View style={styles.tabContent}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.activeTabText,
                    ]}>
                    {t.providerBookings.tabs[tab]}
                  </Text>
                  {tabUnreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {tabUnreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filteredAppointments as any}
          renderItem={renderBookingCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t.providerBookings.noAppointments.replace(
                  '{status}',
                  t.providerBookings.tabs[activeTab],
                )}
              </Text>
            </View>
          }
        />

        <ProviderFooter />
      </View>
    </SafeAreaView>
  );
};

export default ProviderBookings;
