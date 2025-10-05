import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  ImageBackground,
} from 'react-native';
import Colors from '../../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SuccessModal from '../../../components/SuccessModal/SuccessModal';
import {UserStackParamList} from '../../../types/types';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from '../../../contexts/TranslationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {SafeAreaView} from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<UserStackParamList, 'ReviewBookingScreen'>;

interface Appointment {
  id: number;
  appointment_day: string;
  appointment_time: string;
  status: string;
  total_amount: string;
  note: string | null;
  cancel_reason: string | null;
  salon: {
    id: number;
    name: string;
    image_url: string | null;
    service_fee: string | null;
  };
  services: Array<{
    id: number;
    service: string;
    price: string;
    time: string;
  }>;
}

const ReviewBookingScreen = ({
  route,
  navigation,
}: NativeStackScreenProps<UserStackParamList, 'ReviewBookingScreen'>) => {
  const {booking, isCompleted} = route.params;
  const {t, isRTL} = useTranslation();
  const appointment = booking as Appointment;

  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  // Calculate correct total amount including service fee
  const calculateTotalAmount = () => {
    const servicesTotal = appointment.services.reduce(
      (sum, service) => sum + parseFloat(service.price),
      0,
    );
    const serviceFee = parseFloat(appointment.salon.service_fee || '0');
    return (servicesTotal + serviceFee).toFixed(2);
  };

  // Add detailed logging
  useEffect(() => {
    const correctTotal = calculateTotalAmount();
    console.log('📋 Appointment Details:', {
      id: appointment.id,
      date: appointment.appointment_day,
      time: appointment.appointment_time,
      status: appointment.status,
      totalAmount: appointment.total_amount,
      correctTotalAmount: correctTotal,
      note: appointment.note,
      cancelReason: appointment.cancel_reason,
      salon: {
        id: appointment.salon.id,
        name: appointment.salon.name,
        imageUrl: appointment.salon.image_url,
        serviceFee: appointment.salon.service_fee,
      },
      services: appointment.services.map(service => ({
        id: service.id,
        name: service.service,
        price: service.price,
        duration: service.time,
      })),
    });
  }, [appointment]);

  const checkNotificationPermission = async () => {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('🔔 Notification permission not granted');
        const permissionRequest = await messaging().requestPermission();
        const enabledAfterRequest =
          permissionRequest === messaging.AuthorizationStatus.AUTHORIZED ||
          permissionRequest === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabledAfterRequest) {
          console.log('✅ Notification permission granted');
          // Get FCM token
          const fcmToken = await messaging().getToken();
          console.log('📱 FCM Token:', fcmToken);
        } else {
          console.log('❌ User denied notification permission');
        }
      } else {
        console.log('✅ Notification permission already granted');
        // Get FCM token
        const fcmToken = await messaging().getToken();
        console.log('📱 FCM Token:', fcmToken);
      }
    } catch (error) {
      console.error('❌ Error checking notification permission:', error);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleReasonSubmit = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found');
        throw new Error('No authentication token found');
      }

      const requestData = {
        appointment_id: Number(appointment.id),
        cancel_reason: cancelReason.trim(),
        status: 'cancelled',
      };

      console.log('📤 Request Headers:', {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      });
      console.log('📤 Request Body:', JSON.stringify(requestData, null, 2));

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

      // Log the raw response first
      const rawResponse = await response.text();
      console.log('📥 Raw API Response:', rawResponse);

      let data;
      try {
        data = JSON.parse(rawResponse);
        console.log('📥 Parsed API Response:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (data.success) {
        console.log('✅ Appointment cancelled successfully');
        setShowCancelModal(false);
        // Navigate to Booking screen with initialTab set to 'cancelled'
        navigation.navigate('BookingScreen', {initialTab: 'cancelled'});
      } else {
        console.log('❌ Failed to cancel appointment:', data);
        Alert.alert(t.reviewBooking.errors.cancelAppointment);
      }
    } catch (error: any) {
      console.error('❌ Error in API call:', {
        message: error?.message || 'Unknown error',
        error: error,
      });
      Alert.alert(t.reviewBooking.errors.cancelAppointment);
    } finally {
      console.log('🏁 Cancel appointment process completed');
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModalVisible(false);
    navigation.navigate('HomeScreen');
  };

  const handleSubmitReview = async () => {
    try {
      console.log('=== STARTING REVIEW SUBMISSION ===');
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found');
        throw new Error('No authentication token found');
      }
      console.log('✅ Token retrieved successfully');

      if (rating === 0) {
        console.log('❌ No rating selected');
        Alert.alert(t.reviewBooking.errors.noRating);
        return;
      }
      console.log('✅ Rating validated:', rating);

      const requestData = {
        salon_id: appointment.salon.id,
        rate: rating,
        message: reviewMessage.trim(),
      };

      console.log('📤 Request Details:', JSON.stringify(requestData, null, 2));
      console.log('URL: https://bella-glam.com/api/create-review');
      console.log('Method: POST');
      console.log('Headers:', {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      });
      console.log('Body:', JSON.stringify(requestData, null, 2));

      console.log('🔄 Making API call...');
      const response = await fetch('https://bella-glam.com/api/create-review', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Headers:', response.headers);

      const data = await response.json();
      console.log('📥 Response Data:', JSON.stringify(data, null, 2));

      if (data.message === 'Review added successfully') {
        console.log('✅ Review submitted successfully');
        console.log('Review Details:', {
          salonId: appointment.salon.id,
          rating: rating,
          message: reviewMessage.trim(),
        });
        Alert.alert(t.reviewBooking.successReviewModal.message);
        setRating(0);
        setReviewMessage('');
      } else {
        console.log('❌ Failed to submit review');
        console.log('Error Details:', data);
        Alert.alert(t.reviewBooking.errors.submitReview);
      }
    } catch (error: any) {
      console.error('❌ Error in review submission process:');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      Alert.alert(t.reviewBooking.errors.submitReview);
    } finally {
      console.log('=== REVIEW SUBMISSION PROCESS COMPLETED ===');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Convert "08:30:00" to "08:30"
  };

  return (
    <View style={styles.container}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: Colors.black,
          paddingHorizontal: 15,
          paddingVertical: 20,
        }}>
        <ImageBackground
          source={require('../../../assets/images/pink-bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.reviewBooking.title}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.content}>
            <View
              style={[
                styles.row,
                {flexDirection: !isRTL ? 'row' : 'row-reverse'},
              ]}>
              <View>
                <Text
                  style={[
                    styles.label,
                    {textAlign: !isRTL ? 'left' : 'right'},
                  ]}>
                  {t.reviewBooking.dateTime.title}
                </Text>
                <Text style={styles.value}>
                  {formatDate(appointment.appointment_day)}
                </Text>
                <Text
                  style={[
                    styles.value,
                    {textAlign: !isRTL ? 'left' : 'right'},
                  ]}>
                  {formatTime(appointment.appointment_time)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.row,
                {flexDirection: !isRTL ? 'row' : 'row-reverse'},
              ]}>
              <View>
                <Text style={styles.label}>Salon</Text>
                <Text style={styles.value}>{appointment.salon.name}</Text>
              </View>
              <Image
                source={
                  appointment.salon.image_url
                    ? {uri: appointment.salon.image_url}
                    : require('../../../assets/images/alia-ahmad.png')
                }
                style={styles.stylistImage}
              />
            </View>
            <View style={styles.servicesSection}>
              <Text style={styles.label}>{t.reviewBooking.services.title}</Text>
              {appointment.services.map((service, index) => (
                <View
                  key={index}
                  style={[
                    styles.serviceRow,
                    {flexDirection: !isRTL ? 'row' : 'row-reverse'},
                  ]}>
                  <Text style={styles.serviceName}>{service.service}</Text>
                  <Text style={styles.servicePrice}>{service.price} JDs</Text>
                </View>
              ))}
              <View
                style={[
                  styles.serviceRow,
                  {flexDirection: !isRTL ? 'row' : 'row-reverse'},
                ]}>
                <Text style={styles.serviceFeeText}>
                  {t.reviewBooking.services.serviceFee}
                </Text>
                <Text style={styles.serviceFeeText}>
                  {appointment.salon.service_fee || '0'} JDs
                </Text>
              </View>
              <View
                style={[
                  styles.serviceRow,
                  {flexDirection: !isRTL ? 'row' : 'row-reverse'},
                ]}>
                <Text style={styles.totalText}>
                  {t.reviewBooking.services.total}
                </Text>
                <Text style={styles.totalText}>
                  {calculateTotalAmount()} JDs
                </Text>
              </View>
            </View>

            <View style={styles.noteSection}>
              <Text style={styles.label}>{t.reviewBooking.note.title}</Text>
              <Text style={styles.noteText}>
                {appointment.note || t.reviewBooking.note.noNote}
              </Text>
            </View>

            {appointment.status === 'cancelled' && (
              <View style={styles.noteSection}>
                <Text style={styles.label}>
                  {t.reviewBooking.cancelReason.title}
                </Text>
                <Text style={styles.noteText}>
                  {appointment.cancel_reason ||
                    t.reviewBooking.cancelReason.noReason}
                </Text>
              </View>
            )}

            {isCompleted ? (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>
                  {t.reviewBooking.review.title}
                </Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder={t.reviewBooking.review.placeholder}
                  placeholderTextColor={Colors.white}
                  multiline
                  value={reviewMessage}
                  onChangeText={setReviewMessage}
                />
                <View style={styles.reviewActions}>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starButton}>
                        <Icon
                          name={star <= rating ? 'star' : 'star-border'}
                          size={24}
                          color={Colors.gold}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.postButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleSubmitReview}
                    disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.black} />
                    ) : (
                      <Text style={styles.postButtonText}>Post</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : appointment.status !== 'cancelled' ? (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>
                  {t.reviewBooking.cancelButton}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>

        {/* Custom Cancel Modal */}
        <Modal
          visible={showCancelModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancelModalClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {t.reviewBooking.cancelModal.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {t.reviewBooking.cancelModal.subtitle}
                </Text>

                <TextInput
                  style={styles.reasonInput}
                  placeholder={t.reviewBooking.cancelModal.placeholder}
                  placeholderTextColor={Colors.softGray}
                  multiline
                  value={cancelReason}
                  onChangeText={setCancelReason}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButtonModal]}
                    onPress={handleCancelModalClose}
                    disabled={isLoading}>
                    <Text style={styles.cancelButtonTextModal}>
                      {t.reviewBooking.cancelModal.back}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.confirmButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleReasonSubmit}
                    disabled={!cancelReason.trim() || isLoading}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.black} />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        {t.reviewBooking.cancelModal.confirm}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Success Modal */}
        <SuccessModal
          visible={isSuccessModalVisible}
          onClose={handleSuccessModalClose}
          message={t.reviewBooking.successModal.message}
        />
      </SafeAreaView>
    </View>
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
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.hardGray,
    paddingVertical: 15,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  stylistImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  servicesSection: {
    marginTop: 20,
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
  cancelButton: {
    backgroundColor: Colors.black,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  cancelButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
  },
  reviewSection: {
    marginTop: 20,
  },
  reviewLabel: {
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
    color: Colors.white,
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: Colors.softGray,
    borderRadius: 10,
    color: Colors.white,
    padding: 10,
    fontFamily: 'Maitree-Regular',
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 10,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5, // Add spacing between stars
  },
  postButton: {
    backgroundColor: Colors.gold,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  postButtonText: {
    fontSize: 14,
    fontFamily: 'Maitree-Medium',
    color: Colors.black,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: Colors.black,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Maitree-Bold',
    color: Colors.gold,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    marginBottom: 15,
    textAlign: 'center',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.softGray,
    borderRadius: 10,
    color: Colors.white,
    padding: 10,
    fontFamily: 'Maitree-Regular',
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 20,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 12,
    borderRadius: 25,
    width: '48%',
    alignItems: 'center',
  },
  cancelButtonModal: {
    backgroundColor: Colors.softGray,
  },
  confirmButton: {
    backgroundColor: Colors.gold,
  },
  cancelButtonTextModal: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: 'Maitree-Medium',
  },
  confirmButtonText: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: 'Maitree-Medium',
  },
  disabledButton: {
    opacity: 0.6,
  },
  noteSection: {
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
    color: Colors.white,
    marginTop: 5,
    lineHeight: 20,
  },
  starButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default ReviewBookingScreen;
