import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import ProviderStack from './ProviderStack';
import {AuthNavigator} from './AuthNavigator';
import UserStack from './UserStack';
import {StatusBar} from 'react-native';
import {GuestModeProvider, useGuestMode} from '../contexts/GuestModeContext';

const Stack = createNativeStackNavigator();

const RootNavigatorContent = () => {
  const {isAuthenticated, user} = useSelector((state: RootState) => state.auth);
  const {isGuestMode, targetScreen} = useGuestMode();

  useEffect(() => {
    console.log('RootNavigator - Auth state changed:');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('user type:', user?.type);
    console.log('isGuestMode:', isGuestMode);
  }, [isAuthenticated, user, isGuestMode]);

  // If user is authenticated, show the appropriate stack
  if (isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {user?.type === 'salon' ? (
          <Stack.Screen name="Provider" component={ProviderStack} />
        ) : (
          <Stack.Screen name="User" component={UserStack} />
        )}
      </Stack.Navigator>
    );
  }

  // If in guest mode, show user stack
  if (isGuestMode) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="User" component={UserStack} />
      </Stack.Navigator>
    );
  }

  // Otherwise show auth stack with target screen
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen 
        name="Auth" 
        component={AuthNavigator} 
        initialParams={{ targetScreen }}
        key={targetScreen} // Force re-mount when targetScreen changes
      />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <GuestModeProvider>
      <RootNavigatorContent />
    </GuestModeProvider>
  );
};

export default RootNavigator;
