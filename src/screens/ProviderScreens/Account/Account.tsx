import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import ProfileHeader from '../../../components/ProfileHeader/ProfileHeader';
import styles from './Account.styles';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../../constants/Colors';
import {useSelector, useDispatch} from 'react-redux';
import {AppDispatch, RootState} from '../../../redux/store';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import useLogout from '../../../hooks/useLogout';
import ProviderFooter from '../../../components/ProviderFooter/ProviderFooter';
import {useTranslation} from '../../../contexts/TranslationContext';
import LogoutModal from './components/LogoutModal';
import LanguageChangeModal from './components/LanguageChangeModal';
import {Language} from '../../../contexts/TranslationContext';
import {useLanguageChange} from '../../../hooks/useLanguageChange';

const ProviderAccountScreen: React.FC = () => {
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [promotionalNotifications, setPromotionalNotifications] =
    useState<boolean>(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [newLanguage, setNewLanguage] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProp<any>>();
  const {t, language, isRTL} = useTranslation();
  const {handleLanguageChange} = useLanguageChange();

  const togglePushNotifications = () => setPushNotifications(prev => !prev);
  const togglePromotionalNotifications = () =>
    setPromotionalNotifications(prev => !prev);

  const {token, user} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchOnlineStatus = async () => {
      try {
        const response = await fetch(
          `https://bella-glam.com/api/salons/is-online/${user?.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch online status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setIsOnline(data.is_online);
        } else {
          console.error('Failed to fetch online status:', data.message);
        }
        console.log('isOnline STATIssS', data);
      } catch (error) {
        console.error('Error fetching online status:', error);
      }
    };

    if (user?.id && token) {
      fetchOnlineStatus();
    }
    console.log('the salon current data', user);
  }, [user?.id, token]);

  const toggleAvailability = async () => {
    try {
      setIsTogglingStatus(true);

      if (!token) {
        Alert.alert(t.account.errorTitle, t.account.authError);
        return;
      }

      console.log('Current is_online status before toggle:', isOnline);
      const response = await fetch(
        'https://bella-glam.com/api/salons/toggle-status',
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to toggle status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Toggle status response:', data);

      if (data.success) {
        setIsOnline(data.is_online);
        Alert.alert(
          t.account.statusUpdated,
          data.message ||
            (!isOnline
              ? t.account.availableMessage
              : t.account.unavailableMessage),
        );
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling availability status:', error);
      Alert.alert(t.account.errorTitle, t.account.updateError);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleOptionPress = (option: string) => {
    if (option === 'Language') {
      const newLang = language === 'en' ? 'ar' : 'en';
      setNewLanguage(newLang);
      setShowLanguageModal(true);
    } else if (option === 'Privacy Policy') {
      navigation.navigate('ProviderPrivacyPolicyScreen');
    } else if (option === 'Terms of Service') {
      navigation.navigate('ProviderTermsPolicyScreen');
    } else if (option === 'Help Center') {
      navigation.navigate('ProviderHelpCenterScreen');
    }
  };

  const handleLanguageChangeConfirm = () => {
    setShowLanguageModal(false);
    handleLanguageChange(newLanguage as Language);
  };

  const {handleLogout} = useLogout();

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <ImageBackground
        source={require('../../../assets/images/pink-bg.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <View style={[styles.container, isRTL && {direction: 'rtl'}]}>
        <ScrollView>
          <ProfileHeader
            isProvider={false}
            image={user?.image || require('../../../assets/images/eyebrow.png')}
            name={user?.name || 'Guest'}
            email={user?.email}
            onBackPress={() => navigation.goBack()}
            back={false}
          />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.account.myAccount}</Text>
            <TouchableOpacity
              style={[
                styles.option,
                {flexDirection: !isRTL ? 'row-reverse' : 'row'},
              ]}
              onPress={() => handleOptionPress('Language')}>
              <Icon name="language" size={20} color={Colors.gold} />
              <Text style={styles.optionText}>{t.account.language}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.option,
                {flexDirection: !isRTL ? 'row-reverse' : 'row'},
              ]}
              onPress={() => handleOptionPress('Privacy Policy')}>
              <Icon name="policy" size={20} color={Colors.gold} />
              <Text style={styles.optionText}>{t.account.privacyPolicy}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.option,
                {flexDirection: !isRTL ? 'row-reverse' : 'row'},
              ]}
              onPress={() => handleOptionPress('Terms of Service')}>
              <Icon name="description" size={20} color={Colors.gold} />
              <Text style={styles.optionText}>{t.account.termsOfService}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>{t.account.notifications}</Text>

            <View
              style={[
                styles.option,
                {flexDirection: !isRTL ? 'row-reverse' : 'row'},
              ]}>
              <Switch
                value={pushNotifications}
                onValueChange={togglePushNotifications}
                trackColor={{false: Colors.softGray, true: Colors.green}}
                thumbColor={pushNotifications ? Colors.green : Colors.softGray}
              />
              {/* <Icon name="notifications-none" size={20} color={Colors.gold} /> */}
              <Text style={[styles.optionText]}>
                {t.account.pushNotifications}
              </Text>
            </View>
            <View
              style={[
                styles.option,
                {flexDirection: !isRTL ? 'row-reverse' : 'row'},
              ]}>
              <Switch
                value={promotionalNotifications}
                onValueChange={togglePromotionalNotifications}
                trackColor={{false: Colors.softGray, true: Colors.green}}
                thumbColor={
                  promotionalNotifications ? Colors.green : Colors.softGray
                }
              />
              <Text style={styles.optionText}>
                {t.account.promotionalNotifications}
              </Text>
            </View>
            <View
              style={[
                styles.option,
                {flexDirection: !isRTL ? 'row-reverse' : 'row'},
              ]}>
              {/* <Icon name="notifications-none" size={20} color={Colors.gold} /> */}
              <Switch
                value={isOnline}
                onValueChange={toggleAvailability}
                trackColor={{false: Colors.softGray, true: Colors.green}}
                thumbColor={isOnline ? Colors.green : Colors.softGray}
                disabled={isTogglingStatus}
              />
              <Text style={styles.optionText}>{t.account.availableNow}</Text>
            </View>

            {/* <Text style={styles.sectionTitle}>{t.account.accountSettings}</Text> */}
            {/* <TouchableOpacity
              style={styles.option}
              onPress={() => navigation.navigate('EditPersonalInfo')}
            > */}
            {/* <Text style={styles.optionText}>{t.account.editPersonalInfo}</Text>
              <Icon name="chevron-right" size={24} color={Colors.softGray} />
            </TouchableOpacity>
             */}
            {/* <TouchableOpacity
              style={styles.option}
              onPress={() => navigation.navigate('ServiceAreaSettings')}
            >
              <Text style={styles.optionText}>{t.account.serviceAreaSettings}</Text>
              <Icon name="chevron-right" size={24} color={Colors.softGray} />
            </TouchableOpacity> */}

            <Text style={styles.sectionTitle}>{t.account.more}</Text>
            <TouchableOpacity
              style={[
                styles.option,
                {flexDirection: !isRTL ? 'row-reverse' : 'row'},
              ]}
              onPress={() => handleOptionPress('Help Center')}>
              <Icon name="help-outline" size={20} color={Colors.gold} />
              <Text style={styles.optionText}>{t.account.helpCenter}</Text>
            </TouchableOpacity>
            <LinearGradient
              colors={['#dc3545', '#b71c1c']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.logoutGradient}>
              <TouchableOpacity
                style={styles.logoutButtonInner}
                onPress={confirmLogout}
                activeOpacity={0.8}>
                <Icon
                  name="power-settings-new"
                  size={20}
                  color={Colors.white}
                />
                <Text style={[styles.logoutText, {marginLeft: 10}]}>
                  {t.account.logout}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
        <ProviderFooter />

        <LogoutModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogoutConfirm}
        />

        <LanguageChangeModal
          visible={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
          onConfirm={handleLanguageChangeConfirm}
          currentLanguage={language}
          newLanguage={newLanguage}
        />
      </View>
    </SafeAreaView>
  );
};

export default ProviderAccountScreen;
