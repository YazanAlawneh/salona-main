import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CancelAppointmentModal from '../../../components/CancelAppointmentModal/CancelAppointmentModal';
import SuccessModal from '../../../components/SuccessModal/SuccessModal';
import ProviderFooter from '../../../components/ProviderFooter/ProviderFooter';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ProviderStackParamList} from '../../../types/types';
import {Address} from '../../../screens/userscreens/EditLocation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import {useTranslation} from '../../../contexts/TranslationContext';
import {format} from 'date-fns';
import {arSA} from 'date-fns/locale';

type Props = NativeStackScreenProps<
  ProviderStackParamList,
  'ProviderReviewBookingScreen'
>;

const ProviderReviewBookingScreen: React.FC<Props> = ({route, navigation}) => {
  const {bookingDetails, isCompleted} = route.params;
  const [address, setAddress] = useState<Address | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const {t, isRTL} = useTranslation();
  const [isCancelled, setIsCancelled] = useState(false);

  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);

  // Function to handle phone call
  const handlePhoneCall = () => {
    if (appointmentData?.user?.phone_number) {
      const phoneNumber = appointmentData.user.phone_number;

      // Use a more reliable approach for making phone calls
      if (Platform.OS === 'android') {
        // For Android, use the tel: scheme directly
        Linking.openURL(`tel:${phoneNumber}`).catch(err => {
          console.error('Error opening phone call:', err);
          Alert.alert(
            t.reviewBooking.phone.errorTitle,
            t.reviewBooking.phone.errorMessage,
          );
        });
      } else {
        // For iOS, use tel:// scheme
        Linking.openURL(`tel://${phoneNumber}`).catch(err => {
          console.error('Error opening phone call:', err);
          Alert.alert(
            t.reviewBooking.phone.errorTitle,
            t.reviewBooking.phone.errorMessage,
          );
        });
      }
    }
  };

  // Initialize appointment data from route params
  useEffect(() => {
    console.log('📥 Received booking details:', bookingDetails);
    console.log('isRTL', isRTL);
    // Check if bookingDetails is an object (full appointment data) or just an ID
    if (typeof bookingDetails === 'object' && bookingDetails !== null) {
      console.log('✅ Using appointment data from route params');
      setAppointmentData(bookingDetails);

      // Check if the booking is cancelled
      if ((bookingDetails as any).status === 'cancelled') {
        setIsCancelled(true);
      }

      // Set address directly from bookingDetails
      if ((bookingDetails as any).address) {
        setAddress((bookingDetails as any).address);
      } else {
        console.log('ℹ️ No address found in booking details');
        setAddressError(
          'No address information available for this appointment.',
        );
      }
    } else if (typeof bookingDetails === 'number') {
      // Fallback to fetching appointment by ID if only ID is provided
      console.log('⚠️ Only appointment ID provided, fetching full details');
      fetchAppointmentDetails(bookingDetails);
    } else {
      console.error('❌ Invalid booking details:', bookingDetails);
      setAppointmentError('Invalid booking details');
    }
  }, [bookingDetails]);

  // Fetch appointment details by ID
  const fetchAppointmentDetails = async (appointmentId: number) => {
    try {
      setLoadingAppointment(true);
      setAppointmentError(null);
      console.log(
        '🔄 Starting appointment fetch for booking ID:',
        appointmentId,
      );

      // Get the token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      console.log('✅ Token retrieved successfully');

      // Fetch the appointment details
      console.log('🔄 Fetching appointment details from API...');
      const appointmentResponse = await fetch(
        `https://bella-glam.com/api/appointments/${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!appointmentResponse.ok) {
        if (appointmentResponse.status === 404) {
          console.log(
            '⚠️ Appointment not found (404). This might be a new appointment or the ID is incorrect.',
          );
          setAppointmentError(
            'Appointment not found. This might be a new appointment or the ID is incorrect.',
          );
          setLoadingAppointment(false);
          return;
        }
        throw new Error(
          `Failed to fetch appointment: ${appointmentResponse.status}`,
        );
      }

      const data = await appointmentResponse.json();
      console.log('📥 Appointment data received:', data);
      setAppointmentData(data.appointment);

      // Check if the booking is cancelled
      if (data.appointment && data.appointment.status === 'cancelled') {
        setIsCancelled(true);
      }

      console.log('✅ Appointment data set in state');

      // Set address directly from the appointment data
      if (data.appointment && data.appointment.address) {
        setAddress(data.appointment.address);
      } else {
        console.log('ℹ️ No address found in appointment data');
        setAddressError(
          'No address information available for this appointment.',
        );
      }
    } catch (error) {
      console.error('❌ Error fetching appointment details:', error);
      setAppointmentError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch appointment details',
      );
    } finally {
      setLoadingAppointment(false);
      console.log('🏁 Appointment fetch process completed');
    }
  };

  const handleCancelPress = () => {
    setIsCancelModalVisible(true);
  };

  const handleCancelModalClose = () => {
    setIsCancelModalVisible(false);
  };

  const handleReasonSubmit = async (reason: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(t.reviewBooking.errors.authentication);
        return;
      }

      const requestData = {
        appointment_id: appointmentData?.id,
        cancel_reason: reason.trim(),
        status: 'cancelled',
      };

      const response = await fetch(
        'https://bella-glam.com/api/update-appointment-status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(requestData),
        },
      );

      const data = await response.json();

      if (data.success) {
        setIsCancelModalVisible(false);
        // Navigate to Booking screen with initialTab set to 'cancelled'
        navigation.navigate('ProviderBookingScreen', {initialTab: 'cancelled'});
      } else {
        Alert.alert(t.reviewBooking.errors.cancelAppointment);
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      Alert.alert(t.reviewBooking.errors.cancelAppointment);
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    console.log('Navigate to Home Page');
  };

  // Format date and time from the appointment data
  let formattedDateTime = '';
  if (appointmentData?.appointment_day && appointmentData?.appointment_time) {
    const dateTimeString = `${appointmentData.appointment_day}T${appointmentData.appointment_time}`;
    try {
      const dateObj = new Date(dateTimeString);
      const formattedDate = format(dateObj, 'MMMM d, yyyy', {
        locale: isRTL ? arSA : undefined,
      });
      const dayName = format(dateObj, 'EEEE', {
        locale: isRTL ? arSA : undefined,
      });
      const formattedHour = format(dateObj, 'hh:mm a', {
        locale: isRTL ? arSA : undefined,
      });
      formattedDateTime = `${formattedDate} (${dayName}) ${
        isRTL ? 'في' : 'at'
      } ${formattedHour}`;
    } catch (e) {
      formattedDateTime = `${appointmentData.appointment_day} at ${appointmentData.appointment_time}`;
    }
  }

  // Calculate total amount including service fee
  const calculateTotalAmount = () => {
    const servicesTotal =
      appointmentData?.services?.reduce(
        (sum: number, service: any) => sum + parseFloat(service.price),
        0,
      ) || 0;
    const serviceFee = parseFloat(appointmentData?.salon?.service_fee || '0');
    return (servicesTotal + serviceFee).toFixed(2);
  };

  const handleCheckoutPress = async () => {
    try {
      console.log('Checkout pressed - updating status to completed');

      // Get the token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(t.reviewBooking.errors.authentication);
        return;
      }

      // Prepare the request body
      const requestBody = {
        appointment_id: appointmentData.id,
        status: 'completed',
        cancel_reason: 'no cancellation',
      };

      console.log('Sending request to update appointment status:', requestBody);
      console.log('Using token:', token.substring(0, 10) + '...');

      // Make the API call
      const response = await fetch(
        'https://bella-glam.com/api/update-appointment-status',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      // Log the response status and headers for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(response.headers));

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (response.ok) {
          console.log('Appointment status updated successfully:', data);
          Alert.alert(t.reviewBooking.success.completed);
          navigation.goBack();
        } else {
          console.error('Failed to update appointment status:', data);
          Alert.alert(t.reviewBooking.errors.updateAppointment);
        }
      } else {
        // If not JSON, get the text response for debugging
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        Alert.alert(t.reviewBooking.errors.invalidResponse);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      Alert.alert(t.reviewBooking.errors.updateAppointment);
    }
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization();
        setLocationPermissionGranted(true);
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to show directions to the customer.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        setLocationPermissionGranted(
          granted === PermissionsAndroid.RESULTS.GRANTED,
        );
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
    }
  };

  useEffect(() => {
    console.log('user appointment name', appointmentData?.user?.name);
  }, []);

  // Function to open Google Maps with directions
  const openGoogleMapsDirections = async () => {
    if (!address) {
      console.error('No address available for directions');
      return;
    }

    // Check if we have location permission
    if (!locationPermissionGranted) {
      console.log('🔄 Requesting location permission...');
      await requestLocationPermission();

      // If permission was denied, directly show the customer's location
      if (!locationPermissionGranted) {
        console.log(
          '⚠️ Location permission denied, showing customer location only',
        );
        const {latitude, longitude} = address;
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url).catch(err => {
          console.error('Error opening maps:', err);
        });
        return;
      }
    }

    // Get provider's current location
    console.log('🔄 Getting provider location for directions...');

    // Set a timeout for the location request
    const locationTimeout = setTimeout(() => {
      console.log(
        '⚠️ Location request timed out, opening maps without directions',
      );
      // Fallback to just showing the customer's location
      const {latitude, longitude} = address;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url).catch(err => {
        console.error('Error opening maps:', err);
      });
    }, 10000); // 10 second timeout

    // Check if location services are enabled
    Geolocation.getCurrentPosition(
      async position => {
        clearTimeout(locationTimeout);
        console.log('✅ Provider location obtained:', position);

        const providerLat = position.coords.latitude;
        const providerLng = position.coords.longitude;
        const customerLat = address.latitude;
        const customerLng = address.longitude;

        console.log('📍 Provider location:', providerLat, providerLng);
        console.log('📍 Customer location:', customerLat, customerLng);

        // Open Google Maps with directions
        const url = `https://www.google.com/maps/dir/?api=1&origin=${providerLat},${providerLng}&destination=${customerLat},${customerLng}&travelmode=driving`;
        console.log('🗺️ Opening Google Maps with URL:', url);

        try {
          await Linking.openURL(url);
          console.log('✅ Google Maps opened successfully');
        } catch (error) {
          console.error('❌ Error opening Google Maps:', error);
          // Fallback to just showing the customer's location
          const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${customerLat},${customerLng}`;
          Linking.openURL(fallbackUrl).catch(err => {
            console.error('Error opening fallback maps URL:', err);
          });
        }
      },
      error => {
        clearTimeout(locationTimeout);
        console.error('❌ Error getting provider location:', error);

        // Directly show the customer's location without showing an alert
        const {latitude, longitude} = address;
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        console.log('⚠️ Falling back to showing customer location only:', url);

        Linking.openURL(url).catch(err => {
          console.error('Error opening fallback maps URL:', err);
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000, // 8 second timeout
        maximumAge: 10000, // Accept positions up to 10 seconds old
      },
    );
  };

  if (loadingAppointment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
        <View style={styles.header}>
          {isRTL ? (
            <>
              <View style={styles.spacer} />
              <Text style={styles.headerTitle}>{t.reviewBooking.title}</Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Icon name="arrow-forward" size={24} color={Colors.white} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t.reviewBooking.title}</Text>
              <View style={styles.spacer} />
            </>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.loadingText}>{t.reviewBooking.loading}</Text>
        </View>
        <ProviderFooter />
      </SafeAreaView>
    );
  }

  if (appointmentError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
        <View style={styles.header}>
          {isRTL ? (
            <>
              <View style={styles.spacer} />
              <Text style={styles.headerTitle}>{t.reviewBooking.title}</Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Icon name="arrow-forward" size={24} color={Colors.white} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t.reviewBooking.title}</Text>
              <View style={styles.spacer} />
            </>
          )}
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={Colors.red} />
          <Text style={styles.errorText}>{t.reviewBooking.error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>
              {t.reviewBooking.actions.back}
            </Text>
          </TouchableOpacity>
        </View>
        <ProviderFooter />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      <View style={styles.header}>
        {isRTL ? (
          <>
            <View style={styles.spacer} />
            <Text style={styles.headerTitle}>{t.reviewBooking.title}</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-forward" size={24} color={Colors.white} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.reviewBooking.title}</Text>
            <View style={styles.spacer} />
          </>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.bookingCard}>
          <Image
            source={require('../../../assets/images/prettyLogo.png')}
            style={styles.customerImage}
          />
          <View style={styles.bookingInfo}>
            <Text style={styles.customerName}>
              {appointmentData?.user?.name || t.reviewBooking.customerInfo.name}
            </Text>
            <Text style={styles.serviceCount}>
              {`${t.reviewBooking.customerInfo.services} ${
                appointmentData?.services?.length || '0'
              }`}
            </Text>
            <Text style={styles.price}>
              {`${t.reviewBooking.customerInfo.price} ${
                appointmentData?.total_amount || '0'
              }`}
            </Text>
            <Text style={styles.time}>{formattedDateTime}</Text>
            <Text>
              {appointmentData?.user?.phone_number
                ? `${t.reviewBooking.customerInfo.phone} ${appointmentData.user.phone_number}`
                : t.reviewBooking.customerInfo.noPhone}
            </Text>
          </View>
        </View>

        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>
            {t.reviewBooking.services.title}
          </Text>
          {appointmentData?.services?.map((service: any, index: number) => (
            <View key={index} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{service.service}</Text>
              <Text style={styles.servicePrice}>
                {`${t.reviewBooking.customerInfo.price} ${service.price}`}
              </Text>
            </View>
          ))}
          <View style={styles.serviceRow}>
            <Text style={styles.serviceFeeText}>
              {t.reviewBooking.services.serviceFee}
            </Text>
            <Text style={styles.serviceFeeText}>
              {`${t.reviewBooking.customerInfo.price} ${
                appointmentData?.salon?.service_fee || '0'
              }`}
            </Text>
          </View>
          <View style={styles.serviceRow}>
            <Text style={styles.totalText}>
              {t.reviewBooking.services.total}
            </Text>
            <Text style={styles.totalText}>
              {`${
                t.reviewBooking.customerInfo.price
              } ${calculateTotalAmount()}`}
            </Text>
          </View>
        </View>

        {/* Phone Number Section */}
        <View style={styles.phoneContainer}>
          <Text style={styles.locationTitle}>
            {t.reviewBooking.phone.title}
          </Text>
          <TouchableOpacity
            style={[styles.phoneButton, isRTL && styles.phoneButtonRTL]}
            onPress={handlePhoneCall}
            disabled={!appointmentData?.user?.phone_number}>
            <Icon
              name="phone"
              size={20}
              color={Colors.white}
              style={
                isRTL
                  ? {marginLeft: 10, marginRight: 0}
                  : {marginRight: 10, marginLeft: 0}
              }
            />
            <Text style={[styles.phoneText, isRTL && styles.phoneTextRTL]}>
              {appointmentData?.user?.phone_number
                ? `${t.reviewBooking.phone.call} ${appointmentData.user.phone_number}`
                : t.reviewBooking.phone.noPhone}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Note Section */}
        <Text style={[styles.locationTitle]}>{t.reviewBooking.note.title}</Text>
        <View style={[styles.noteContainer]}>
          <Text style={[styles.noteText, isRTL && {textAlign: 'left'}]}>
            {appointmentData?.note || t.reviewBooking.note.noNote}
          </Text>
        </View>

        <View style={[styles.locationContainer]}>
          <Text style={[styles.locationTitle]}>
            {t.reviewBooking.location.title}
          </Text>

          {loadingAddress ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.gold} />
              <Text style={styles.loadingText}>
                {t.reviewBooking.location.loading}
              </Text>
            </View>
          ) : addressError ? (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={24} color={Colors.red} />
              <Text style={styles.errorText}>
                {t.reviewBooking.location.error}
              </Text>
            </View>
          ) : address ? (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Icon name="location-on" size={24} color={Colors.gold} />
                <Text style={styles.addressTitle}>
                  {t.reviewBooking.location.addressTitle}
                </Text>
              </View>
              <Text style={styles.addressDescription}>
                {address.description}
              </Text>

              <TouchableOpacity
                style={styles.mapButton}
                onPress={openGoogleMapsDirections}>
                <Icon name="directions" size={20} color={Colors.black} />
                <Text style={styles.mapButtonText}>
                  {t.reviewBooking.location.getDirections}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noAddressText}>
              {t.reviewBooking.location.noAddress}
            </Text>
          )}
        </View>
      </ScrollView>

      {!isCompleted && !isCancelled && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.checkoutButton]}
            onPress={handleCheckoutPress}>
            <Text style={styles.checkoutButtonText}>
              {t.reviewBooking.actions.checkout}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancelPress}>
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              {t.reviewBooking.actions.cancel}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <CancelAppointmentModal
        visible={isCancelModalVisible}
        onClose={handleCancelModalClose}
        onSubmit={handleReasonSubmit}
      />

      <SuccessModal
        visible={isSuccessModalVisible}
        onClose={handleSuccessModalClose}
        message="Appointment cancelled successfully"
      />

      <ProviderFooter />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
  },
  spacer: {
    width: 34, // Same width as backButton (24px icon + 10px padding)
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.softGray,
    borderRadius: 10,
    marginBottom: 20,
  },
  customerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
    marginBottom: 5,
  },
  serviceCount: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  servicesContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 34,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 18,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
    marginBottom: 15,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  servicePrice: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  serviceFeeText: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  totalText: {
    fontSize: 14,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
  },
  locationContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.softGray,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.red,
  },
  addressCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.softGray,
    borderRadius: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressTitle: {
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
    marginLeft: 10,
  },
  addressDescription: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    marginBottom: 15,
  },
  addressDescriptionRTL: {
    textAlign: 'left',
    marginLeft: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  mapButtonText: {
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
    color: Colors.black,
    marginLeft: 10,
  },
  noAddressText: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.softGray,
    textAlign: 'center',
    padding: 20,
  },
  buttonsContainer: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.gold,
    padding: 8,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.black,
    fontSize: 11,
    fontFamily: 'Maitree-Medium',
  },
  checkoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  checkoutButtonText: {
    color: Colors.gold,
    fontSize: 11,
    fontFamily: 'Maitree-Medium',
  },
  cancelButton: {
    backgroundColor: '#FF0404',
  },
  cancelButtonText: {
    color: Colors.black,
  },
  retryButton: {
    backgroundColor: Colors.gold,
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: 'Maitree-Medium',
    textAlign: 'center',
  },

  phoneContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    marginTop: 10,
  },
  phoneText: {
    fontSize: 18,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    marginLeft: 10,
  },
  phoneContainerRTL: {
    // RTL specific styles if needed
  },
  phoneButtonRTL: {
    flexDirection: 'row-reverse',
  },
  phoneTextRTL: {
    marginRight: 10,
    marginLeft: 0,
  },
  noteContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.black,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    lineHeight: 20,
  },
});

export default ProviderReviewBookingScreen;
