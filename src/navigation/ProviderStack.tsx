import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ProviderHomeScreen from '../screens/ProviderScreens/BookingScreen/Booking';
import ProviderNotifications from '../screens/ProviderScreens/NotificationsScreen/Notifications';
import ProviderBookingScreen from '../screens/ProviderScreens/BookingScreen/Booking';
import ProviderAccount from '../screens/ProviderScreens/Account/Account';
import ProviderProfile from '../screens/ProviderScreens/SalonProfile/SalonProfile';
import ChatListScreen from '../screens/ProviderScreens/ChatListScreen/ChatListScreen';
import ProviderChatScreen from '../screens/ProviderScreens/ChatScreen/ChatScreen';
import ServiceAreaSettings from '../screens/ProviderScreens/ServiceAreaSettings/ServiceAreaSettings';
import ProviderReviewBookingScreen from '../screens/ProviderScreens/ReviewBookingScreen/ReviewBooking';
import ProviderPrivacyPolicyScreen from '../screens/ProviderScreens/PrivacyPolicyScreen/PrivacyPolicy';
import ProviderTermsPolicyScreen from '../screens/ProviderScreens/TermsPolicyScreen/TermsPolicy';
import ProviderHelpCenterScreen from '../screens/ProviderScreens/HelpCenterScreen/HelpCenter';

const Stack = createNativeStackNavigator();

const ProviderStack = () => {
  return (
    <SafeAreaProvider>
      <Stack.Navigator
        initialRouteName="ProviderProfile"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} />
        <Stack.Screen
          name="ProviderNotifications"
          component={ProviderNotifications}
        />
        <Stack.Screen
          name="ProviderBookingScreen"
          component={ProviderBookingScreen}
        />
        <Stack.Screen name="ProviderChatList" component={ChatListScreen} />
        <Stack.Screen
          name="ProviderChatScreen"
          component={ProviderChatScreen}
        />
        <Stack.Screen name="ProviderAccount" component={ProviderAccount} />
        <Stack.Screen name="ProviderProfile" component={ProviderProfile} />
        <Stack.Screen
          name="ServiceAreaSettings"
          component={ServiceAreaSettings}
        />
        <Stack.Screen
          name="ProviderReviewBookingScreen"
          component={ProviderReviewBookingScreen}
        />
        <Stack.Screen
          name="ProviderPrivacyPolicyScreen"
          component={ProviderPrivacyPolicyScreen}
        />
        <Stack.Screen
          name="ProviderTermsPolicyScreen"
          component={ProviderTermsPolicyScreen}
        />
        <Stack.Screen
          name="ProviderHelpCenterScreen"
          component={ProviderHelpCenterScreen}
        />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
};

export default ProviderStack;
