import {useLogoutMutation} from '../redux/api/authApi';
import {useDispatch} from 'react-redux';
import {logout} from '../redux/slices/authSlice';
import {clearSelectedAddress} from '../redux/slices/salonSlice';
import {Alert} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../contexts/TranslationContext';
const useLogout = () => {
  const [logoutApi] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const {t} = useTranslation();
  const handleLogout = async () => {
    try {
      
      // const response = await logoutApi({}).unwrap();
      // console.log('Logout API response:', response);
      console.log('logout trying');
      // Dispatch logout action which will clear auth state
      dispatch(logout());
      // Clear selected address when logging out
      dispatch(clearSelectedAddress()); 
      
      // Show success message
      // Alert.alert('Success', 'You have been logged out.', [
      //   {
      //     text: 'OK',
      //   },
      // ]);
      
      // No need to manually navigate - RootNavigator will handle it based on isAuthenticated state
    } catch (error: any) {
      console.error('Logout failed:', error); 
      const errorMessage =
        error?.data?.message || t.logout.error.logoutFailed;
      Alert.alert(t.logout.error.logoutFailed, errorMessage);
    }
  };

  return {handleLogout};
};

export default useLogout;
