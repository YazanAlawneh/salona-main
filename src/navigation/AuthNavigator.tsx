import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';
import OnboardingScreen from '../screens/userscreens/OnboardingScreen/Onboarding';
import LoginSignupScreen from '../screens/userscreens/LoginSignupScreen/LoginSignup';
import LoginScreen from '../screens/userscreens/LoginScreen/Login';
import SignUpScreen from '../screens/userscreens/SignupScreen/Signup';
// import SignupOTPScreen from '../screens/userscreens/SignupOTPScreen/SignupOTP';
import ForgotPasswordScreen from '../screens/userscreens/ForgotPasswordScreen/ForgotPassword';
import SplashScreen from '../screens/SplashScreen/SplashScreen';
import PrivacyPolicyScreen from '../screens/userscreens/PrivacyPolicyScreen/PrivacyPolicy';
import TermsPolicyScreen from '../screens/userscreens/TermsPolicyScreen/TermsPolicy';
import LanguageSelectionScreen from '../screens/userscreens/LanguageSelectionScreen/LanguageSelection';
import SignupOTPScreen from '../screens/userscreens/SignupOTPScreen/SignupOTP';
const AuthStack = createNativeStackNavigator();

const AuthNavigatorContent = () => {
  const route = useRoute();
  const { targetScreen } = (route.params as { targetScreen?: 'login' | 'signup' | null }) || {};

  console.log('AuthNavigator - targetScreen:', targetScreen);
  console.log('AuthNavigator - route.params:', route.params);

  // Determine initial screen based on target screen
  const getInitialRouteName = () => {
    if (targetScreen === 'login') {
      return 'LoginSignupScreen';
    } else if (targetScreen === 'signup') {
      return 'LoginSignupScreen'; // We'll navigate to SignupScreen from there
    }
    return 'SplashScreen';
  };

  return (
    <AuthStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={getInitialRouteName()}
    >
      <AuthStack.Screen name="SplashScreen" component={SplashScreen} />
      <AuthStack.Screen name="OnboardingScreen" component={OnboardingScreen} />
      <AuthStack.Screen name="LoginSignupScreen" component={LoginSignupScreen} />
      <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
      <AuthStack.Screen name="SignupScreen" component={SignUpScreen} />
      <AuthStack.Screen name="SignupOTPScreen" component={SignupOTPScreen} />
      <AuthStack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
      <AuthStack.Screen name="TermsPolicyScreen" component={TermsPolicyScreen} />
      <AuthStack.Screen name="LanguageSelectionScreen" component={LanguageSelectionScreen} />
    </AuthStack.Navigator>
  );
};

export const AuthNavigator = AuthNavigatorContent; 