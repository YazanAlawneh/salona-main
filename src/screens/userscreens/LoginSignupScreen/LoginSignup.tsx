import React, {useEffect} from 'react';
import {
  View,
  ImageBackground,
  Text,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from '@react-navigation/native';
import styles from './LoginSignup.styles';
import CustomButton from '../../../components/CustomButton/CustomButton';
import Colors from '../../../constants/Colors';
import {useTranslation} from '../../../contexts/TranslationContext';
import {useGuestMode} from '../../../contexts/GuestModeContext';

import LinearGradient from 'react-native-linear-gradient';

const LoginSignupScreen = ({navigation}: {navigation: any}) => {
  const {t} = useTranslation();
  const {setGuestMode} = useGuestMode();
  const route = useRoute();
  const {targetScreen} =
    (route.params as {targetScreen?: 'login' | 'signup' | null}) || {};

  const handleLogin = () => {
    navigation.navigate('LoginScreen');
  };
  const handleProviderLogin = () => {
    navigation.navigate('LoginScreen');
  };
  const handleSignup = () => {
    //get to work copilot
    navigation.navigate('SignupScreen');
  };

  const handleGuestMode = () => {
    setGuestMode(true);
  };

  // Handle target screen navigation
  useEffect(() => {
    console.log('LoginSignupScreen - targetScreen:', targetScreen);
    console.log('LoginSignupScreen - route.params:', route.params);

    if (targetScreen === 'signup') {
      // Navigate to signup screen after a short delay to ensure screen is mounted
      const timer = setTimeout(() => {
        navigation.navigate('SignupScreen');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [targetScreen, navigation, route.params]);

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding-new.jpg')}
      style={{flex: 1}}
      resizeMode="cover">
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={handleProviderLogin}
            style={styles.signUpProviderWrapper}>
            <Text style={styles.signUpProviderTxt}>
              {t.loginSignup.providerLogin}
            </Text>
          </TouchableOpacity>
          <LinearGradient
            colors={[
              'transparent',
              'rgba(255,255,255,0.6)',
              'rgba(255,255,255,1)',
            ]}
            style={styles.background}>
            <View style={styles.buttonContainer}>
              <Text style={styles.title}>Pella</Text>
              <Text style={styles.description}>
                {t.onboarding.takeCareOfYourBeauty}
              </Text>
              <CustomButton
                text={t.loginSignup.login}
                backgroundColor={Colors.black}
                textColor={Colors.white}
                onPress={handleLogin}
                style={[styles.loginButton, {borderColor: Colors.gold}]}
              />
              <CustomButton
                text={t.guestMode.browseAsGuest}
                backgroundColor={Colors.gold}
                textColor={Colors.black}
                onPress={handleGuestMode}
                style={[styles.loginButton, {borderColor: Colors.gold}]}
              />
              {/* <CustomButton
                text={t.loginSignup.providerLogin}
                backgroundColor={Colors.black}
                textColor={Colors.white}
                onPress={handleProviderLogin}
                style={[styles.loginButton, {borderColor: Colors.gold}]}
              /> */}
              {/* <CustomButton
                text={t.loginSignup.signup}
                backgroundColor={Colors.black}
                textColor={Colors.white}
                onPress={handleSignup}
                style={[styles.signupButton, {borderColor: Colors.gold}]}
              /> */}
              <Text style={styles.signInTxt}>
                {t.loginSignup.dontHaveAnAccount}
                {'  '}
                <TouchableOpacity onPress={handleSignup}>
                  <Text style={styles.loginTxtSapan}>
                    {t.loginSignup.signup}
                  </Text>
                </TouchableOpacity>
              </Text>
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default LoginSignupScreen;
