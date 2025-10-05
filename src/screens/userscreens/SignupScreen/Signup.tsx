import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import styles from './Signup.styles';
import Colors from '../../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import CountryPicker from 'react-native-country-picker-modal';
import useRegister from '../../../hooks/useRegister';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from '../../../contexts/TranslationContext';
import ScreenWrapper from '../../../components/ScreenWrapper/ScreenWrapper';

const SignUpScreen = () => {
  const navigation = useNavigation<any>();
  const {t, isRTL} = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const {handleRegister, isLoading} = useRegister();

  // Password validation function
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return t.signup.error.passwordTooShort;
    }
    return '';
  };

  const handleSignUp = async () => {
    // Clear previous password errors
    setPasswordError('');

    if (!name || !email || !password || !confirmPassword || !phoneNumber) {
      Alert.alert(t.signup.error.allFieldsRequired);
      return;
    }

    // Validate password strength
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t.signup.error.passwordsDoNotMatch);
      return;
    }

    if (!acceptTerms) {
      Alert.alert(t.signup.error.mustAcceptTerms);
      return;
    }

    // Validate phone number: must be 9 or 10 digits
    const isValidPhone = /^\d{9,10}$/.test(phoneNumber);
    if (!isValidPhone) {
      Alert.alert(t.signup.error.invalidPhoneNumber);
      return;
    }

    // Create full phone number with +962 prefix
    const fullPhoneNumber = `+962${phoneNumber}`;
    // const fullPhoneNumber = `${phoneNumber}`;

    console.log('🔍 DEBUG: Attempting registration with:', {
      name,
      email,
      phoneNumber: fullPhoneNumber,
      passwordLength: password.length,
      acceptTerms,
    });

    try {
      const result = await handleRegister({
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        phone_number: fullPhoneNumber, // Use the full phone number
      });

      console.log('🔍 DEBUG: Registration result:', result);

      if (result.success && result.response) {
        console.log(
          '🔍 DEBUG: Registration successful, navigating to OTP screen',
        );
        console.log('🔍 DEBUG: UUID received:', result.response.uuid);
        console.log('🔍 DEBUG: UUID received:', result.response);
        navigation.navigate('SignupOTPScreen', {uuid: result.response.uuid});
      } else {
        console.log('🔍 DEBUG: Registration failed:', result.error);
        Alert.alert(
          t.signup.error.signupFailed,
          result.error || 'Unknown error occurred',
        );
      }
    } catch (error) {
      console.error('🔍 DEBUG: Registration error caught:', error);
      Alert.alert(
        t.signup.error.signupFailed,
        'Registration failed. Please try again.',
      );
    }
  };

  const toggleTerms = () => {
    setAcceptTerms(!acceptTerms);
  };

  // Clear password error when password changes
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError('');
    }
  };

  return (
    <ScreenWrapper>
      <StatusBar backgroundColor={Colors.customWhite} barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <View style={styles.backButtonCircle}>
              <Icon name="arrow-back" size={20} color={Colors.black} />
            </View>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingTop: 0, paddingBottom: 0},
          ]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.registerTitle}>
            {t.signup && t.signup.signUp ? t.signup.signUp : 'Register'}
          </Text>
          <Text style={styles.registerSubtitle}>
            {t.signup.welcomeCreateAccount}
          </Text>

          {/* Name Input */}
          <View style={styles.inputGroupField}>
            <Text style={[styles.inputLabel, isRTL && styles.inputLabelRtl]}>
              {t.signup.name}
            </Text>
            <TextInput
              style={[styles.inputField, isRTL && styles.inputFieldRtl]}
              placeholder={t.signup.writeName}
              placeholderTextColor={Colors.softGray}
              value={name}
              onChangeText={setName}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
          {/* Email Input */}
          <View style={styles.inputGroupField}>
            <Text style={[styles.inputLabel, isRTL && styles.inputLabelRtl]}>
              {t.signup.email}
            </Text>
            <TextInput
              style={[styles.inputField, isRTL && styles.inputFieldRtl]}
              placeholder="user@user.com"
              placeholderTextColor={Colors.softGray}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
          {/* Phone Input */}
          <View style={styles.inputGroupField}>
            <Text style={[styles.inputLabel, isRTL && styles.inputLabelRtl]}>
              {t.signup.phoneNumber}
            </Text>
            <View
              style={[styles.phoneInputRow, isRTL && styles.phoneInputRowRtl]}>
              {/* <CountryPicker
                countryCode="JO"
                withFlag
                withCallingCode
                withFilter={false}
                withCountryNameButton={false}
                withAlphaFilter={false}
                withCallingCodeButton={false}
                onSelect={() => {}}
                theme={{
                  backgroundColor: Colors.customWhite,
                  onBackgroundTextColor: Colors.customBlack,
                }}
                containerButtonStyle={styles.flagIcon}
              /> */}
              <Text style={styles.phonePrefix}>+962</Text>
              <TextInput
                style={[
                  styles.inputField,
                  styles.inputFieldPhone,
                  isRTL && styles.inputFieldRtl,
                ]}
                placeholder={t.signup.writePhoneNumber}
                placeholderTextColor={Colors.softGray}
                keyboardType="number-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
          </View>
          {/* Password Input */}
          <View style={styles.inputGroupField}>
            <Text style={[styles.inputLabel, isRTL && styles.inputLabelRtl]}>
              {t.signup.password}
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.inputField,
                  styles.passwordInputField,
                  isRTL && styles.inputFieldRtl,
                ]}
                placeholder={t.signup.writePassword}
                placeholderTextColor={Colors.softGray}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={Colors.softGray}
                />
              </TouchableOpacity>
            </View>
            {passwordError && (
              <Text
                style={[
                  styles.errorText,
                  {textAlign: isRTL ? 'right' : 'left'},
                ]}>
                {passwordError}
              </Text>
            )}
          </View>
          {/* Confirm Password Input */}
          <View style={styles.inputGroupField}>
            <Text style={[styles.inputLabel, isRTL && styles.inputLabelRtl]}>
              {t.signup.confirmPassword}
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.inputField,
                  styles.passwordInputField,
                  isRTL && styles.inputFieldRtl,
                ]}
                placeholder={t.signup.writeConfirmPassword}
                placeholderTextColor={Colors.softGray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={Colors.softGray}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              {t.signup.agreeToThe}
              <Text
                style={styles.termsLink}
                onPress={() => navigation.navigate('TermsPolicyScreen')}>
                {t.signup.termsOfService}
              </Text>{' '}
              {t.signup.and}{' '}
              <Text
                style={styles.termsLink}
                onPress={() => navigation.navigate('PrivacyPolicyScreen')}>
                {t.signup.privacyPolicy}
              </Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.checkbox,
                {backgroundColor: acceptTerms ? Colors.gold : 'transparent'},
              ]}
              onPress={toggleTerms}>
              {acceptTerms && (
                <Icon name="check" size={16} color={Colors.black} />
              )}
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.signUpButton,
              isLoading && styles.signUpButtonDisabled,
              {marginBottom: 32},
            ]}
            onPress={handleSignUp}
            disabled={isLoading}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.black} size="small" />
                <Text style={[styles.signUpButtonText, {marginLeft: 10}]}>
                  {t.signup.signingUp}
                </Text>
              </View>
            ) : (
              <Text style={styles.signUpButtonText}>{t.signup.signUp}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default SignUpScreen;
