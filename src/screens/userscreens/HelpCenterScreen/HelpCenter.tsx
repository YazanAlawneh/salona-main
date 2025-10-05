import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from '../../../contexts/TranslationContext';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './HelpCenter.styles';
import Colors from '../../../constants/Colors';
import {useContactUsMutation} from '../../../redux/api/salonApi';

const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const {t, isRTL} = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactUs] = useContactUsMutation();

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert(t.helpCenter.error, t.helpCenter.pleaseEnterEmail);
      return;
    }

    if (!message.trim()) {
      Alert.alert(t.helpCenter.error, t.helpCenter.pleaseEnterMessage);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t.helpCenter.error, t.helpCenter.pleaseEnterValidEmail);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('=== CONTACT US API CALL STARTED ===');
      console.log('Request URL:', 'https://bella-glam.com/api/new-contact-us');
      console.log('Request Body:', {
        email,
        note: message,
      });

      const result = await contactUs({
        email,
        note: message,
      }).unwrap();

      console.log('=== CONTACT US API RESPONSE ===');
      console.log('Response:', result);
      console.log('API Call Status: Success');
      console.log('Response Data:', JSON.stringify(result, null, 2));

      if (result.success) {
        Alert.alert(t.helpCenter.success, t.helpCenter.messageSentSuccessfully);
        setEmail('');
        setMessage('');
        navigation.goBack();
      } else {
        Alert.alert(t.helpCenter.error, t.helpCenter.somethingWentWrong);
      }
    } catch (error) {
      console.log('=== CONTACT US API ERROR ===');
      console.error('Error Details:', error);
      console.log('Error Response:', error?.data || 'No error data available');
      Alert.alert(t.helpCenter.error, t.helpCenter.somethingWentWrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={24}
            color={Colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.helpCenter.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Image
                source={require('../../../assets/images/help-center.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
              <Text style={styles.sectionTitle}>
                {t.helpCenter.howCanWeHelp}
              </Text>
              <Text style={styles.sectionDescription}>
                {t.helpCenter.helpCenterDescription}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.formSection}>
                <Text style={styles.label}>{t.helpCenter.email}</Text>
                <View style={styles.inputContainer}>
                  <Icon
                    name="mail-outline"
                    size={20}
                    color={Colors.white}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t.helpCenter.enterYourEmail}
                    placeholderTextColor={Colors.white}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>{t.helpCenter.message}</Text>
                <View style={styles.textAreaContainer}>
                  <Icon
                    name="chatbubble-outline"
                    size={20}
                    color={Colors.white}
                    style={styles.textAreaIcon}
                  />
                  <TextInput
                    style={styles.textArea}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={t.helpCenter.enterYourMessage}
                    placeholderTextColor={Colors.white}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {t.helpCenter.submit}
                    </Text>
                    <Icon
                      name="send"
                      size={18}
                      color={Colors.black}
                      style={styles.submitIcon}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HelpCenterScreen;
