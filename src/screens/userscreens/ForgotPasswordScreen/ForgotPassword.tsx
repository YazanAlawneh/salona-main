import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import CustomButton from '../../../components/CustomButton/CustomButton';
import CustomInput from '../../../components/CustomInput/CustomInput';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './ForgotPassword.styles';
import Colors from '../../../constants/Colors';
import {useTranslation} from '../../../contexts/TranslationContext';
import {SafeAreaView} from 'react-native-safe-area-context';

const ForgotPasswordScreen = ({navigation}: {navigation: any}) => {
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      console.log(
        'Attempting to send forgot password request for email:',
        email,
      );
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch(
        'https://bella-glam.com/api/forgot-password',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        },
      );

      const data = await response.json();
      console.log('API Response:', data);

      if (response.ok) {
        console.log('Password reset request successful');
        setUserId(data.user_id);
        setShowOtpModal(true);
      } else {
        console.log('Password reset request failed:', data.message);
        Alert.alert(t.forgotPassword.errorMessage);
      }
    } catch (error) {
      console.error('Error in forgot password request:', error);
      Alert.alert(t.forgotPassword.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsVerifying(true);
      console.log('Starting OTP verification with code:', otp);
      console.log('Using user_id:', userId);

      const requestBody = {
        user_id: userId,
        otpcode: otp,
      };

      console.log('Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://bella-glam.com/api/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('OTP Verification Response Status:', response.status);
      console.log(
        'OTP Verification Response Data:',
        JSON.stringify(data, null, 2),
      );

      if (response.ok) {
        console.log('OTP verification successful');
        setShowOtpModal(false);
        setShowPasswordModal(true);
      } else {
        console.log('OTP verification failed:', data.message);
        Alert.alert(t.forgotPassword.errorMessage);
      }
    } catch (error) {
      console.error('Error in OTP verification:', error);
      Alert.alert(t.forgotPassword.errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setIsResetting(true);
      console.log('Resetting password for user:', userId);

      const requestBody = {
        user_id: userId,
        password: password,
        password_confirmation: passwordConfirmation,
      };

      console.log(
        'Reset Password Request Body:',
        JSON.stringify(requestBody, null, 2),
      );

      const response = await fetch(
        'https://bella-glam.com/api/reset-password',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      const data = await response.json();
      console.log('Reset Password Response Status:', response.status);
      console.log(
        'Reset Password Response Data:',
        JSON.stringify(data, null, 2),
      );

      if (response.ok) {
        console.log('Password reset successful');
        Alert.alert('Success', data.message || 'Password reset successfully');
        navigation.goBack();
      } else {
        console.log('Password reset failed:', data.message);
        Alert.alert(t.forgotPassword.errorMessage);
      }
    } catch (error) {
      console.error('Error in password reset:', error);
      Alert.alert(t.forgotPassword.errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}} backgroundColor="#fff">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <View style={styles.backButtonCircle}>
              <Icon name="arrow-back" size={20} color={Colors.black} />
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>{t.forgotPassword.title}</Text>
        </View>
        <View style={styles.secondSection}>
          <Text style={styles.instructions}>
            {t.forgotPassword.instructions}
          </Text>

          <CustomInput
            label={t.forgotPassword.label}
            placeholder={t.forgotPassword.placeholder}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <CustomButton
            text={isLoading ? '' : t.forgotPassword.confirmButton}
            onPress={handleConfirm}
            backgroundColor={Colors.gold}
            textColor={Colors.black}
            style={styles.confirmButton}
            loading={isLoading}
          />
        </View>

        <Modal
          visible={showOtpModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOtpModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.forgotPassword.otpTitle}</Text>
              <Text style={styles.modalSubtitle}>
                {t.forgotPassword.otpSubtitle}
              </Text>

              <TextInput
                style={styles.otpInput}
                placeholder={t.forgotPassword.otpPlaceholder}
                placeholderTextColor={Colors.softGray}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                autoFocus={true}
                editable={!isVerifying}
              />

              <View style={styles.modalButtons}>
                <CustomButton
                  text="Cancel"
                  onPress={() => setShowOtpModal(false)}
                  backgroundColor={Colors.softGray}
                  textColor={Colors.black}
                  style={styles.modalButton}
                  disabled={isVerifying}
                />
                <CustomButton
                  text={isVerifying ? '' : 'Verify'}
                  onPress={handleVerifyOtp}
                  backgroundColor={Colors.gold}
                  textColor={Colors.black}
                  style={styles.modalButton}
                  loading={isVerifying}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPasswordModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {t.forgotPassword.resetPasswordTitle}
              </Text>
              <Text style={styles.modalSubtitle}>
                {t.forgotPassword.resetPasswordSubtitle}
              </Text>

              <TextInput
                style={styles.otpInput}
                placeholder={t.forgotPassword.newPasswordPlaceholder}
                placeholderTextColor={Colors.softGray}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!isResetting}
              />

              <TextInput
                style={[styles.otpInput, {marginTop: 10}]}
                placeholder={t.forgotPassword.confirmPasswordPlaceholder}
                placeholderTextColor={Colors.softGray}
                secureTextEntry
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                editable={!isResetting}
              />

              <View style={styles.modalButtons}>
                <CustomButton
                  text={t.forgotPassword.cancelButton}
                  onPress={() => setShowPasswordModal(false)}
                  backgroundColor={Colors.softGray}
                  textColor={Colors.black}
                  style={styles.modalButton}
                  disabled={isResetting}
                />
                <CustomButton
                  text={isResetting ? '' : t.forgotPassword.resetPasswordButton}
                  onPress={handleResetPassword}
                  backgroundColor={Colors.gold}
                  textColor={Colors.black}
                  style={styles.modalButton}
                  loading={isResetting}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
