import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import HomeScreen from '../screens/userscreens/HomeScreen/Home';
import ExploreScreen from '../screens/userscreens/ExploreScreen/Explore';
import FilterScreen from '../screens/userscreens/FilterScreen/Filter';
import OurSalonsScreen from '../screens/userscreens/OurSalonsScreen/OurSalons';
import SalonProfileScreen from '../screens/userscreens/SalonProfileScreen/SalonProfile';
import AccountScreen from '../screens/userscreens/AccountScreen/Account';
import BookingsPage from '../screens/userscreens/BookingScreen/Booking';
import NotificationsScreen from '../screens/userscreens/NotificationsScreen/NotificationsScreen';
import EditProfileScreen from '../screens/userscreens/EditProfileScreen/EditProfile';
import EditLocation from '../screens/userscreens/EditLocation/EditLocation';
import FavoritesScreen from '../screens/userscreens/FavoritesScreen/Favorites';
import ReviewBookingScreen from '../screens/userscreens/ReviewBookingScreen/ReviewBooking';
import ChatScreen from '../screens/userscreens/ChatScreen/ChatScreen';
import UserChatListScreen from '../screens/userscreens/ChatListScreen/UserChatListScreen';
import FCMTokenScreen from '../screens/userscreens/FCMTokenScreen';
import PrivacyPolicyScreen from '../screens/userscreens/PrivacyPolicyScreen/PrivacyPolicy';
import TermsPolicyScreen from '../screens/userscreens/TermsPolicyScreen/TermsPolicy';
import HelpCenterScreen from '../screens/userscreens/HelpCenterScreen/HelpCenter';
import { RootState } from '../redux/store';

const Stack = createNativeStackNavigator();

export type UserStackParamList = {
  HomeScreen: undefined;
  ExploreScreen: undefined;
  FilterScreen: undefined;
  OurSalonsScreen: undefined;
  SalonProfileScreen: undefined;
  AccountScreen: undefined;
  BookingScreen: undefined;
  NotificationsScreen: undefined;
  EditProfileScreen: undefined;
  EditLocationScreen: undefined;
  FavoritesScreen: undefined;
  ReviewBookingScreen: undefined;
  ChatScreen: { user: { id: number; name: string; image_url: string; } };
  UserChatListScreen: undefined;
  FCMTokenScreen: undefined;
  PrivacyPolicyScreen: undefined;
  TermsPolicyScreen: undefined;
  HelpCenterScreen: undefined;
};

const UserStack = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return (
    <Stack.Navigator screenOptions={{headerShown: false,}} initialRouteName={isAuthenticated ? 'HomeScreen' : 'ExploreScreen'}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ExploreScreen" component={ExploreScreen} />
      <Stack.Screen name="FilterScreen" component={FilterScreen} />
      <Stack.Screen name="OurSalonsScreen" component={OurSalonsScreen} />
      <Stack.Screen name="SalonProfileScreen" component={SalonProfileScreen} />
      <Stack.Screen name="AccountScreen" component={AccountScreen} />
      <Stack.Screen name="BookingScreen" component={BookingsPage} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
      <Stack.Screen name="EditLocationScreen" component={EditLocation} />
      <Stack.Screen name="FavoritesScreen" component={FavoritesScreen} />
      <Stack.Screen name="ReviewBookingScreen" component={ReviewBookingScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="UserChatListScreen" component={UserChatListScreen} />
      <Stack.Screen name="FCMTokenScreen" component={FCMTokenScreen} options={{ title: 'FCM Token' }} />
      <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsPolicyScreen" component={TermsPolicyScreen} />
      <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />

    </Stack.Navigator>
  );
};

export default UserStack;
