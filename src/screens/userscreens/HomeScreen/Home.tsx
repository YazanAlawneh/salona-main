import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  PermissionsAndroid,
  TextInput,
  StyleSheet,
  StatusBar,
  Pressable,
  Touchable,
  Linking,
} from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomSheetModal from './components/BottomSheetModal';
import LocationPermissionModal from './components/LocationPermissionModal';

import Colors from '../../../constants/Colors';
import styles from './Home.styles';
import BeautyServicesSection from '../../../components/BeautyServices/BeautyServices';
import Footer from '../../../components/Footer/Footer';
import {Link, useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../../../redux/store';
import {setSalons, setSelectedAddress} from '../../../redux/slices/salonSlice';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Salon} from '../../../types/salon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from '../../../contexts/TranslationContext';
import {useGuestMode} from '../../../contexts/GuestModeContext';
import {
  useGetAllSalonsQuery,
  useGetCategoriesQuery,
  useGetAddressesQuery,
  useGetNearbySalonsQuery,
  useCreateAddressMutation,
  useUpdatePrimaryAddressMutation,
  useGetAdsQuery,
} from '../../../redux/api/salonApi';
// import {skip} from '@reduxjs/toolkit/query';
import {Package} from '../../../components/PackagesSection/PackagesSection';
import messaging from '@react-native-firebase/messaging';
import {GOOGLE_MAPS_API_KEY} from '@env';

import SearchBarWithMenu from '../../../components/SearchBarWithMenu/SearchBarWithMenu';
import {Address} from '../../userscreens/EditLocation/types';
import DeliveryLocationSheet from './components/DeliveryLocatioinSheet';
import Swiper from 'react-native-swiper';
import {SafeAreaView} from 'react-native-safe-area-context';

interface ExtendedSalon extends Salon {
  working_hours?: any[];
  latitude?: number;
  longitude?: number;
  deleted_at?: string | null;
  is_verified?: boolean;
}

type SalonResponse = {
  salons: Salon[];
};

interface MappedSalon {
  id: string;
  title: string;
  image: any;
  distance?: string;
  time?: string;
  rating?: string;
  isService?: boolean;
}

type RootStackParamList = {
  UserChatListScreen: undefined;
  OurSalonsScreen: {category_id?: number};
  SalonProfileScreen: {
    salon: {
      id: number;
      name: string;
      image: string;
    };
    initialTab?: string;
  };
  NotificationsScreen: undefined;
  ExploreScreen: {filters: {categories?: string[]; categoryNames?: string[]; initialTab?: string; search?: string}};
  EditLocationScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NearbySalon {
  id: number;
  name: string;
  description: string;
  salon_latitude: string;
  salon_longitude: string;
  distance: number;
  image_url: string | null;
  rating_avg: any;
  travelTime?: string;
}

interface NearbySalonsResponse {
  success: boolean;
  salons: NearbySalon[];
}

// Transform NearbySalon to match Salon type
const mapNearbySalonToSalon = (nearbySalon: NearbySalon): ExtendedSalon => {
  return {
    id: nearbySalon.id,
    name: nearbySalon.name,
    image_url: nearbySalon.image_url,
    latitude: parseFloat(nearbySalon.salon_latitude),
    longitude: parseFloat(nearbySalon.salon_longitude),
    email: '',
    avatar: null,
    address: '',
    bio: '',
    phone_number: null,
    type: '',
    about: '',
    email_verified_at: null,
    working_hours: [],
    ratings_received: [],
    categories: [],
    services: [],
    packages: [],
    created_at: '',
    updated_at: '',
    deleted_at: null,
    is_active: 1,
    is_online: 1,
    average_rating: '0',
    is_verified: true,
    verification_code: null,
    availabilities: [],
  };
};

interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  image_url: string;
  created_at: string | null;
  updated_at: string | null;
}

interface CategoriesResponse {
  success: boolean;
  categories: Category[];
}

interface PackagesResponse {
  success: boolean;
  packages: {
    data: Package[];
  };
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const {t, isRTL} = useTranslation();

  // Debug translation loading
  console.log('HomeScreen - Translation loaded:', {
    search_here: t.home.search_here,
    currentLanguage: t ? 'loaded' : 'not loaded',
    isRTL,
  });
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationPermissionModal, setShowLocationPermissionModal] =
    useState(false);
  const [hasRequestedLocationPermission, setHasRequestedLocationPermission] =
    useState(false);

  // RTK Query hooks
  const {data: salonsData, isLoading: salonsLoading} = useGetAllSalonsQuery({});
  const {data: adsData, isLoading: adsLoading, error: adsError} = useGetAdsQuery();
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery();
  const {
    data: addressesData,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
    error: addressesError,
  } = useGetAddressesQuery();
  const [createAddress] = useCreateAddressMutation();
  const [updatePrimaryAddress] = useUpdatePrimaryAddressMutation();

  const selectedAddress = useSelector(
    (state: RootState) => state.salons.selectedAddress,
  );

  // Nearby salons query - only runs when we have coordinates
  const nearbySalonsQueryParams = selectedAddress && selectedAddress.latitude && selectedAddress.longitude
    ? {
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        radius: 20,
      }
    : {
        latitude: 0,
        longitude: 0,
        radius: 20,
      };

  console.log('🔍 [DEBUG] [HomeScreen] Nearby salons query params:', nearbySalonsQueryParams);
  console.log('🔍 [DEBUG] [HomeScreen] Selected address:', selectedAddress);

  const {data: nearbySalonsData, isLoading: nearbySalonsLoading, error: nearbySalonsError} =
    useGetNearbySalonsQuery(nearbySalonsQueryParams);

  // Extract data from RTK Query responses
  const ads = Array.isArray(adsData) ? adsData : [];
  const categories = categoriesData?.categories || [];
  const userAddresses = addressesData?.addresses || [];
  const nearbySalons = nearbySalonsData?.salons || [];

  // Debug logging
  console.log('🔍 [DEBUG] [HomeScreen] RTK Query Data:', {
    adsData,
    ads,
    adsLoading,
    adsError,
    categoriesData,
    categories,
    categoriesLoading,
    categoriesError,
    addressesData,
    userAddresses,
    addressesLoading,
    addressesError,
    nearbySalonsData,
    nearbySalons,
    nearbySalonsLoading,
    nearbySalonsError,
  });

  // Loading state - much simpler now
  const isLoadingAny =
    adsLoading ||
    categoriesLoading ||
    addressesLoading ||
    nearbySalonsLoading;

  // Additional debugging for rendering
  console.log('Rendering Debug:', {
    adsLength: ads.length,
    categoriesLength: categories.length,
    isLoadingAny,
    adsLoading,
    categoriesLoading,
  });

  const handleLocationPermissionAllow = async () => {
    setShowLocationPermissionModal(false);
    setHasRequestedLocationPermission(true);

    try {
      console.log('🔍 [DEBUG] [HomeScreen] Requesting location permission...');
      
      // For Android, request location permission
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        console.log('🔍 [DEBUG] [HomeScreen] Android permission result:', granted);
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ [DEBUG] [HomeScreen] Android permission granted, getting location...');
          await getCurrentLocation();
        } else {
          console.log('❌ [DEBUG] [HomeScreen] Android permission denied');
        }
      } else {
        // For iOS, request location permission and get location
        console.log('🔍 [DEBUG] [HomeScreen] iOS platform, getting location...');
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('❌ [DEBUG] [HomeScreen] Error getting location after permission:', error);
      // Set a fallback location (Amman, Jordan)
      setCurrentLocation({lat: 31.95, lng: 35.91});
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('🔍 [DEBUG] [HomeScreen] Getting current location...');
      
      // Try Google Geolocation API first (more reliable)
      const response = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            considerIp: true,
          }),
        }
      );

      const data = await response.json();
      console.log('🔍 [DEBUG] [HomeScreen] Google Geolocation API response:', data);

      if (data.location) {
        console.log('✅ [DEBUG] [HomeScreen] Location obtained from Google Geolocation API:', {
          latitude: data.location.lat,
          longitude: data.location.lng,
          accuracy: data.accuracy
        });
        setCurrentLocation(data.location);
        return;
      }
    } catch (googleError) {
      console.log('⚠️ [DEBUG] [HomeScreen] Google Geolocation API failed, trying native geolocation:', googleError);
    }

    // Fallback to native geolocation
    try {
      const Geolocation = require('@react-native-community/geolocation');
      
      return new Promise<void>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position: any) => {
            console.log('✅ [DEBUG] [HomeScreen] Location obtained from native geolocation:', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            resolve();
          },
          (error: any) => {
            console.error('❌ [DEBUG] [HomeScreen] Native geolocation error:', error);
            // Set fallback location
            setCurrentLocation({lat: 31.95, lng: 35.91});
            resolve(); // Don't reject, just use fallback
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      });
    } catch (nativeError) {
      console.error('❌ [DEBUG] [HomeScreen] Native geolocation failed:', nativeError);
      // Set fallback location
      setCurrentLocation({lat: 31.95, lng: 35.91});
    }
  };

  const handleLocationPermissionNotNow = () => {
    setShowLocationPermissionModal(false);
    setHasRequestedLocationPermission(true);
    console.log('User chose not to grant location permission');
  };

  // Handle address selection
  const handleAddressSelect = useCallback(
    async (address: any) => {
      dispatch(setSelectedAddress(address));
      setIsAddressModalVisible(false);
      try {
        await updatePrimaryAddress(Number(address.id));
        console.log('Address selected and set as primary');
      } catch (error) {
        console.error('Error updating primary address:', error);
      }
    },
    [dispatch, updatePrimaryAddress],
  );

  const handleCurrentLocationSelect = useCallback(
    async (locationData: any) => {
      console.log('🔍 [DEBUG] [HomeScreen] Current location selected:', locationData);
      
      if (locationData) {
        // Use the location data passed from the sheet
        const currentLocationAddress = {
          id: locationData.id || 'current-location',
          description: locationData.description || 'Current Location',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          isPrimary: false,
          isFavorite: false,
        };
        handleAddressSelect(currentLocationAddress);
      } else if (currentLocation) {
        // Fallback to existing currentLocation if no data passed
        const currentLocationAddress = {
          id: 'current-location',
          description: 'Current Location',
          latitude: (currentLocation as {lat: number; lng: number}).lat,
          longitude: (currentLocation as {lat: number; lng: number}).lng,
          isPrimary: false,
          isFavorite: false,
        };
        handleAddressSelect(currentLocationAddress);
      } else {
        // No location available, try to get current location
        console.log('🔍 [DEBUG] [HomeScreen] No current location available, attempting to get location...');
        try {
          await getCurrentLocation();
          // After getting location, try again
          if (currentLocation) {
            const currentLocationAddress = {
              id: 'current-location',
              description: 'Current Location',
              latitude: (currentLocation as {lat: number; lng: number}).lat,
              longitude: (currentLocation as {lat: number; lng: number}).lng,
              isPrimary: false,
              isFavorite: false,
            };
            handleAddressSelect(currentLocationAddress);
          }
        } catch (error) {
          console.error('❌ [DEBUG] [HomeScreen] Failed to get current location:', error);
        }
      }
    },
    [currentLocation, handleAddressSelect],
  );

  const handleAddNewAddress = useCallback(() => {
    setIsAddressModalVisible(false);
    navigation.navigate('EditLocationScreen');
  }, [navigation]);

  const handleGoFilter = useCallback(() => {
    (navigation as any).navigate('FilterScreen');
  }, [navigation]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
    (navigation as any).navigate('ExploreScreen', {
        filters: {
          // Narrow type expects only categories here; Explore handles search from SearchBar
          categories: [],
        },
      });
    }
  }, [searchQuery, navigation]);

  const handleMenuPress = useCallback(() => {
    console.log('Menu button pressed');
  }, []);

  const handleNotificationPress = () => {
    navigation.navigate('NotificationsScreen');
  };

  const handleChatPress = () => {
    console.log('Navigating to UserChatListScreen');
    navigation.navigate('UserChatListScreen');
  };

  const handlePackagePress = useCallback(
    (packageItem: Package) => {
      const salon = packageItem.salon
        ? {
            id: packageItem.salon.id,
            name: packageItem.salon.name,
            image: packageItem.salon.image_url || '',
          }
        : {
            id: packageItem.salon_id,
            name: packageItem.salon_name,
            image: packageItem.salon_image || '',
          };
      console.log('package:');
      console.log(packageItem);

      navigation.navigate('SalonProfileScreen', {
        salon,
        initialTab: 'Packages',
      });
    },
    [navigation],
  );

  const handleGoSearch = useCallback(() => {
    navigation.navigate('ExploreScreen', {
      filters: {
        categories: [],
      },
    });
  }, [navigation]);

  const handleRefreshLocation = useCallback(async () => {
    console.log('🔍 [DEBUG] [HomeScreen] Manual location refresh requested');
    try {
      await getCurrentLocation();
      console.log('✅ [DEBUG] [HomeScreen] Location refreshed successfully');
    } catch (error) {
      console.error('❌ [DEBUG] [HomeScreen] Failed to refresh location:', error);
    }
  }, []);

  const requestUserPermission = async () => {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      } else {
        console.log('Notification permission not granted');
      }
    } else {
      // For Android, just request the permission directly without custom dialog
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
      }
    }
  };

  const {isGuestMode, exitToLogin, exitToSignup} = useGuestMode();
  // Initialize location permission check on mount
  useEffect(() => {
    // Check if we should show location permission modal
    const checkLocationPermission = async () => {
      try {
        console.log('🔍 [DEBUG] [HomeScreen] Checking location permission...');
        
        // Check if location permission is already granted
        if (Platform.OS === 'ios') {
          // For iOS, try to get location directly first
          console.log('🔍 [DEBUG] [HomeScreen] iOS platform, attempting to get location...');
          try {
            await getCurrentLocation();
          } catch (error) {
            console.log('⚠️ [DEBUG] [HomeScreen] iOS location failed, showing permission modal');
            setShowLocationPermissionModal(true);
          }
        } else {
          // For Android, check current permission status
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          console.log('🔍 [DEBUG] [HomeScreen] Android permission status:', granted);
          
          if (granted) {
            console.log('✅ [DEBUG] [HomeScreen] Android permission already granted, getting location...');
            await getCurrentLocation();
          } else if (!hasRequestedLocationPermission) {
            console.log('🔍 [DEBUG] [HomeScreen] Android permission not granted, showing modal');
            setShowLocationPermissionModal(true);
          }
        }
      } catch (error) {
        console.error('❌ [DEBUG] [HomeScreen] Error checking location permission:', error);
        // Fallback to showing modal
        setShowLocationPermissionModal(true);
      }
    };

    checkLocationPermission();
    requestUserPermission();
  }, [hasRequestedLocationPermission]);

  // Set primary address when addresses are loaded
  useEffect(() => {
    if (userAddresses.length > 0 && !selectedAddress) {
      const primaryAddress = userAddresses.find(addr => addr.is_primary === 1);
      if (primaryAddress) {
        dispatch(setSelectedAddress(primaryAddress));
      }
    }
  }, [userAddresses, selectedAddress, dispatch]);

  // Handle case when no addresses exist
  useEffect(() => {
    const handleNoAddresses = async () => {
      if (userAddresses.length === 0 && currentLocation) {
        try {
          console.log('🔍 [DEBUG] [HomeScreen] No addresses found, creating from current location...');
          console.log('🔍 [DEBUG] [HomeScreen] Current location:', currentLocation);
          
          // Get address from coordinates
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${currentLocation.lat},${currentLocation.lng}&key=${GOOGLE_MAPS_API_KEY}`;
          console.log('🔍 [DEBUG] [HomeScreen] Geocoding URL:', geocodeUrl);
          
          const geocodeResponse = await fetch(geocodeUrl);
          console.log('🔍 [DEBUG] [HomeScreen] Geocoding response status:', geocodeResponse.status);
          
          const geocodeData = await geocodeResponse.json();
          console.log('🔍 [DEBUG] [HomeScreen] Geocoding response data:', geocodeData);

          if (geocodeData.results && geocodeData.results[0]) {
            const addressDescription = geocodeData.results[0].formatted_address;
            console.log('✅ [DEBUG] [HomeScreen] Found address:', addressDescription);
            
            await createAddress({
              description: addressDescription,
              is_favorite: false,
              latitude: currentLocation.lat.toString(),
              longitude: currentLocation.lng.toString(),
            });
            console.log('✅ [DEBUG] [HomeScreen] Address created successfully');
            
            // Refetch addresses to get the new one
            refetchAddresses();
          } else {
            console.log('⚠️ [DEBUG] [HomeScreen] No geocoding results found');
          }
        } catch (error) {
          console.error('❌ [DEBUG] [HomeScreen] Error creating address from current location:', error);
        }
      }
    };

    handleNoAddresses();
  }, [userAddresses.length, currentLocation, createAddress, refetchAddresses]);

  // Transform nearby salons for display
  const mappedSalons = useMemo(() => {
    console.log('🔍 [DEBUG] [HomeScreen] Mapping nearby salons...');
    console.log('🔍 [DEBUG] [HomeScreen] Nearby salons to map:', nearbySalons);
    
    return nearbySalons.map((salon: any, index): MappedSalon => {
      console.log(`🔍 [DEBUG] [HomeScreen] Processing salon ${index + 1}/${nearbySalons.length}:`, salon.name);
      console.log(`🔍 [DEBUG] [HomeScreen] Salon data:`, {
        id: salon.id,
        name: salon.name,
        distance: salon.distance,
        travelTime: salon.travelTime,
        image_url: salon.image_url,
        average_rating: salon.average_rating
      });
      
      // Normalize and safely format distance
      const rawDistance = salon.distance as unknown;
      const numericDistance =
        typeof rawDistance === 'number'
          ? rawDistance
          : typeof rawDistance === 'string'
            ? parseFloat(rawDistance)
            : NaN;
      const hasValidDistance = Number.isFinite(numericDistance) && numericDistance >= 0;
      const distanceText = hasValidDistance
        ? numericDistance < 1
          ? `${Math.max(0, Math.round(numericDistance * 1000))}m`
          : `${numericDistance.toFixed(1)} km`
        : undefined;

      console.log(`🔍 [DEBUG] [HomeScreen] Distance text for ${salon.name}:`, distanceText);

      const mappedSalon = {
        id: salon.id.toString(),
        title: salon.name,
        image: salon.image_url
          ? {uri: salon.image_url}
          : require('../../../assets/images/alia-ahmad.png'),
        distance: distanceText,
        time: salon.travelTime || undefined,
        rating: salon.average_rating || '0.0',
      };
      
      console.log(`✅ [DEBUG] [HomeScreen] Mapped salon ${salon.name}:`, mappedSalon);
      return mappedSalon;
    });
  }, [nearbySalons]);

  console.log('Loading states:', {
    adsLoading,
    categoriesLoading,
    addressesLoading,
    nearbySalonsLoading,
    isLoadingAny,
  });

  // Ads section rendering
  const renderAdItem = ({item}: {item: any}) => {
    const imageSource = item.image_url
      ? {uri: item.image_url}
      : require('../../../assets/images/prettyLogo.png');
    const handlePress = async () => {
      try {
        const rawUrl = (item?.url || '').trim();
        if (!rawUrl) {
          return;
        }
        const normalizedUrl = /^https?:\/\//i.test(rawUrl)
          ? rawUrl
          : `https://${rawUrl}`;
        const supported = await Linking.canOpenURL(normalizedUrl);
        if (supported) {
          await Linking.openURL(normalizedUrl);
        }
      } catch (e) {
        console.log('Failed to open ad url', e);
      }
    };
    return (
      <TouchableOpacity style={styles.packageContainer} activeOpacity={0.85} onPress={handlePress}>
        <View style={styles.packageCard}>
          <View style={styles.packageImageContainer}>
            <Image source={imageSource} style={styles.packageImage} resizeMode="cover" />
            <View style={styles.packageGradient} />
            <View style={styles.packageContent}>
              <View style={styles.packageHeader}>
                <Text style={styles.packageTitle} numberOfLines={2}>
                  {item.title || ''}
                </Text>
              </View>
              {item.description ? (
                <View style={styles.packageDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="information-circle-outline" size={14} color={Colors.black} />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const SearchBar = useCallback(() => {
    console.log(
      'SearchBar render - search_here translation:',
      t.home.search_here,
    );
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={styles.searchField}
            onPress={handleGoSearch}
            activeOpacity={0.9}>
            <Icon
              style={styles.searchIcon}
              name="search-outline"
              size={20}
              color={Colors.gold}
            />
            <TextInput
              style={styles.input}
              placeholder={t.home.search_here}
              placeholderTextColor={Colors.hardGray}
              editable={false} // prevent typing
              pointerEvents="none" // prevent touch
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            activeOpacity={0.9}
            onPress={handleGoFilter}>
            <Icon name="options-outline" size={26} color={Colors.gold} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleGoSearch, handleGoFilter, t.home.search_here]);

  // const bottomSheetRef = useRef<BottomSheetModal>(null);

  const openModal = useCallback(
    () => (
      <BottomSheetModal
        visible={isAddressModalVisible}
        onClose={() => setIsAddressModalVisible(false)}
        title={t.home.selectAddress}>
        {addressesLoading ? (
          <ActivityIndicator size="large" color={Colors.gold} />
        ) : (
            <DeliveryLocationSheet
            currenctLocation={
              currentLocation
                ? {
                    id: 'current-location',
                    description: t.home.currentLocation,
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                  }
                : null
            }
              selectedAddress={selectedAddress as any}
            handleSelected={handleAddressSelect}
            setCurrentLocation={handleCurrentLocationSelect}
            addNewAddress={handleAddNewAddress}
              addresses={userAddresses as any}
          />
        )}
      </BottomSheetModal>
    ),
    [
      isAddressModalVisible,
      t.home.selectAddress,
      addressesLoading,
      currentLocation,
      selectedAddress,
      handleAddressSelect,
      handleCurrentLocationSelect,
      handleAddNewAddress,
      userAddresses,
    ],
  );

  const handleSalonPress = useCallback(
    (salon: any) => {
      navigation.navigate('SalonProfileScreen', {
        salon,
        initialTab: 'Services',
      });
    },
    [navigation],
  );

  const handleViewAllPress = useCallback(() => {
    navigation.navigate('ExploreScreen', {
      filters: {categories: []},
    });
  }, [navigation]);

  const handleCategoryPress = useCallback(
    (categoryId: number, categoryName: string) => {
      (navigation as any).navigate('ExploreScreen', {
        filters: {
          categories: [categoryId.toString()],
          categoryNames: [categoryName],
          initialTab: 'Services',
        },
      });
    },
    [navigation],
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content" // or 'dark-content' depending on background
      />
      {/* <View style={styles.container}> */}
      {/* Address Selection Modal */}
      {openModal()}

      {isLoadingAny ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text
            style={{marginTop: 10, textAlign: 'center', color: Colors.gold}}>
            {t.home.loading}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.mainContainer}>
            {/* Header Section - Full Width */}
            <View style={styles.headerSection}>
              <Text style={styles.locationTxt}>{t.home.location}</Text>
              <View style={[styles.header, isRTL && styles.headerRTL]}>
                <TouchableOpacity
                  style={[
                    styles.addressButton,
                    !isRTL && styles.addressButtonNotRTL,
                  ]}
                  onPress={() => setIsAddressModalVisible(true)}>
                  <View
                    style={[
                      styles.addressTextHolder,
                      !isRTL && styles.addressTextHolderNotRTL,
                    ]}>
                    {/* <Text style={styles.addressTextPlaceholder}>
                      {t.home.amAt}
                    </Text> */}
                    <Text style={styles.addressText} numberOfLines={1}>
                      {selectedAddress ? selectedAddress.description : ''}
                    </Text>
                    <Icon name="chevron-down" size={20} color={Colors.black} />
                  </View>
                  <Icon name="location-sharp" size={18} color={Colors.black} />
                </TouchableOpacity>
                {isGuestMode && (
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={exitToLogin}
                    style={styles.exitGuestModeButton}>
                    <Text style={styles.exitGuestModeText}>
                      {t.home.exitGuestMode}
                    </Text>
                  </TouchableOpacity>
                )}

                {!isGuestMode && (
                  <TouchableOpacity
                    style={styles.notificationIconContainer}
                    onPress={() => navigation.navigate('NotificationsScreen')}>
                    <Icon name="notifications" size={20} color={Colors.black} />
                  </TouchableOpacity>
                )}

                {/* <TouchableOpacity
                  style={styles.notificationIconContainer}
                  onPress={() => navigation.navigate('NotificationsScreen')}>
                  <Icon name="notifications" size={20} color={Colors.black} />
                </TouchableOpacity> */}
              </View>
              <SearchBar />
            </View>
            {/* Content Section - With Padding */}
            <View style={styles.contentSection}>
              <View style={styles.sectionSpacing}>
                {/* <SwiperComponent /> */}
              </View>

              {/* offers */}
              <View style={styles.sectionSpacing2}>
                {/* <Text style={styles.sectionTitle}>{t.home.offers}</Text> */}
                {/* <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}> */}
                {adsLoading ? (
                  <FlatList
                    data={[1, 2, 3]} // Show 3 skeleton items
                    keyExtractor={item => `skeleton-${item}`}
                    renderItem={() => (
                      <View style={styles.packageContainer}>
                        <View style={styles.packageCard}>
                          <View style={styles.packageImageContainer}>
                            <View style={styles.skeletonImage} />
                            <View style={styles.packageContent}>
                              <View style={styles.skeletonTitle} />
                              <View style={styles.skeletonDetails} />
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={3}
                    windowSize={5}
                    initialNumToRender={2}
                    getItemLayout={(data, index) => ({
                      length: 296,
                      offset: 296 * index,
                      index,
                    })}
                  />
                ) : ads.length > 0 ? (
                  <FlatList
                    data={ads}
                    contentContainerStyle={{paddingHorizontal: 4}}
                    keyExtractor={item => `ad-${item.id}`}
                    renderItem={renderAdItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={3}
                    windowSize={5}
                    initialNumToRender={2}
                    getItemLayout={(data, index) => ({
                      length: 296, // 280 width + 16 margin
                      offset: 296 * index,
                      index,
                    })}
                  />
                ) : (
                  // <Swiper
                  //   autoplay
                  //   showsPagination
                  //   dotColor="#ccc"
                  //   loop={false}

                  //   activeDotColor={Colors.gold}
                  //   // height={200}
                  //   contentContainerStyle={{
                  //     paddingHorizontal: 18,
                  //     paddingVertical: 20,
                  //   }}>
                  //   {packages.map(pkg => (
                  //     <PackageItem key={pkg.id} package={pkg} />
                  //   ))}
                  // </Swiper>
                  // <FlatList
                  //   data={packages}
                  //   keyExtractor={item => `package-${item.id}`}
                  //   renderItem={({item}) => <PackageItem package={item} />}
                  //   horizontal
                  //   showsHorizontalScrollIndicator={false}
                  //   removeClippedSubviews={true}
                  //   maxToRenderPerBatch={3}
                  //   windowSize={5}
                  //   initialNumToRender={2}
                  //   getItemLayout={(data, index) => ({
                  //     length: 296, // 280 width + 16 margin
                  //     offset: 296 * index,
                  //     index,
                  //   })}
                  // />
                  <Text style={styles.serviceTitle}>{t.home.noCategoriesAvailable}</Text>
                )}
                {/* </ScrollView> */}
              </View>
              {/* categories */}

              <View style={[styles.sectionSpacing2, {marginTop: 20}]}>
                <Text style={styles.sectionTitle}>{t.home.ourCategories}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}>
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <TouchableOpacity
                        key={category.id}
                        style={styles.serviceItem}
                        onPress={() =>
                          handleCategoryPress(category.id, category.name)
                        }>
                    <Image
                          source={
                            (category as any).image_url
                              ? {uri: (category as any).image_url}
                              : require('../../../assets/images/prettyLogo.png')
                          }
                          style={styles.serviceImage}
                        />
                        <Text style={styles.serviceTitle}>{category.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.serviceTitle}>
                      {t.home.noCategoriesAvailable}
                    </Text>
                  )}
                </ScrollView>
              </View>

              <View style={[styles.sectionSpacing2, {marginTop: 20}]}>
                {nearbySalonsError ? (
                  // Show error state - don't show "no nearby salons" message
                  <View style={styles.errorContainer}>
                    <Icon name="error-outline" size={48} color={Colors.red} />
                    <Text style={styles.errorTitle}>
                      {t.home.nearbySalonsError.title}
                    </Text>
                    <Text style={styles.errorDescription}>
                      {t.home.nearbySalonsError.description}
                    </Text>
                    <TouchableOpacity
                      style={styles.viewAllSalonsButton}
                      onPress={handleViewAllPress}>
                      <Text style={styles.viewAllSalonsButtonText}>
                        {t.home.nearbySalonsError.viewAllSalons}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : mappedSalons.length > 0 ? (
                  // Show nearby salons when data is available
                  <BeautyServicesSection
                      title={t.home.nearbySalons}
                      data={mappedSalons.slice(0, 4)}
                      onItemPress={handleSalonPress}
                      onViewAllPress={handleViewAllPress}
                    />
                ) : (
                  // Show "no nearby salons" only when request was successful but no salons found
                  <View style={styles.noNearbySalonsContainer}>
                    <View style={styles.noNearbySalonsContent}>
                      <Icon name="location-off" size={48} color={Colors.gold} />
                      <Text style={styles.noNearbySalonsTitle}>
                        {t.home.noNearbySalons.title}
                      </Text>
                      <Text style={styles.noNearbySalonsDescription}>
                        {t.home.noNearbySalons.description}
                      </Text>
                      <TouchableOpacity
                        style={styles.viewAllSalonsButton}
                        onPress={handleViewAllPress}>
                        <Text style={styles.viewAllSalonsButtonText}>
                          {t.home.noNearbySalons.viewAllSalons}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* <View style={styles.sectionSpacing2}>
                <PackagesSection
                  title={<Text style={styles.sectionTitle}>{t.home.packages}</Text>}
                  data={packages}
                  onItemPress={handlePackagePress}
                />
              </View> */}
            </View>
          </View>
        </ScrollView>
      )}
      {/* </View> */}
      {!isGuestMode && <Footer />}

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showLocationPermissionModal}
        onAllow={handleLocationPermissionAllow}
        onNotNow={handleLocationPermissionNotNow}
      />
    </View>
  );
};

export default HomeScreen;
