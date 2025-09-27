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
import {
  useGetAllSalonsQuery,
  useGetPackagesQuery,
  useGetCategoriesQuery,
  useGetAddressesQuery,
  useGetNearbySalonsQuery,
  useCreateAddressMutation,
  useUpdatePrimaryAddressMutation,
} from '../../../redux/api/salonApi';
// import {skip} from '@reduxjs/toolkit/query';
import {Package} from '../../../components/PackagesSection/PackagesSection';
import messaging from '@react-native-firebase/messaging';
import {GOOGLE_MAPS_API_KEY} from '@env';

import SearchBarWithMenu from '../../../components/SearchBarWithMenu/SearchBarWithMenu';
import {Address} from '../../userscreens/EditLocation/types';
import DeliveryLocationSheet from './components/DeliveryLocatioinSheet';
import Swiper from 'react-native-swiper';

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
  ExploreScreen: {filters: {categories: string[]}};
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
    working_hours: [],
    ratings_received: [],
    categories: [],
    services: [],
    packages: [],
    created_at: '',
    updated_at: '',
    deleted_at: null,
    is_active: 1,
    is_verified: true,
    verification_code: null,
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
    isRTL
  });
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [hasRequestedLocationPermission, setHasRequestedLocationPermission] = useState(false);

  // RTK Query hooks
  const {data: salonsData, isLoading: salonsLoading} = useGetAllSalonsQuery({});
  const {
    data: packagesData,
    isLoading: packagesLoading,
    error: packagesError,
  } = useGetPackagesQuery();
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
  const {data: nearbySalonsData, isLoading: nearbySalonsLoading} =
    useGetNearbySalonsQuery(
      selectedAddress && selectedAddress.latitude && selectedAddress.longitude
        ? {
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
            radius: 20,
          }
        : {
            latitude: 0,
            longitude: 0,
            radius: 20,
          },
    );

  // Extract data from RTK Query responses
  const packages = packagesData?.packages?.data || [];
  const categories = categoriesData?.categories || [];
  const userAddresses = addressesData?.addresses || [];
  const nearbySalons = nearbySalonsData?.salons || [];

  // Debug logging
  console.log('RTK Query Data:', {
    packagesData,
    packages,
    packagesLoading,
    packagesError,
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
  });

  // Loading state - much simpler now
  const isLoadingAny =
    packagesLoading ||
    categoriesLoading ||
    addressesLoading ||
    nearbySalonsLoading;

  // Additional debugging for rendering
  console.log('Rendering Debug:', {
    packagesLength: packages.length,
    categoriesLength: categories.length,
    isLoadingAny,
    packagesLoading,
    categoriesLoading,
  });



  const handleLocationPermissionAllow = async () => {
    setShowLocationPermissionModal(false);
    setHasRequestedLocationPermission(true);
    
    try {
      // For Android, request location permission
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Permission granted, get current location using Geolocation
          const Geolocation = require('@react-native-community/geolocation');
          Geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              console.log('Location permission granted and location obtained');
            },
            (error) => {
              console.error('Error getting location:', error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        }
      } else {
        // For iOS, we'll need to implement iOS-specific location handling
        // For now, just log that permission was granted
        console.log('Location permission granted on iOS');
      }
    } catch (error) {
      console.error('Error getting location after permission:', error);
    }
  };

  const handleLocationPermissionNotNow = () => {
    setShowLocationPermissionModal(false);
    setHasRequestedLocationPermission(true);
    console.log('User chose not to grant location permission');
  };

  // Handle address selection
  const handleAddressSelect = useCallback(
    async address => {
      dispatch(setSelectedAddress(address));
      setIsAddressModalVisible(false);
      try {
        await updatePrimaryAddress(address.id);
        console.log('Address selected and set as primary');
      } catch (error) {
        console.error('Error updating primary address:', error);
      }
    },
    [dispatch, updatePrimaryAddress],
  );

  const handleCurrentLocationSelect = useCallback((locationData) => {
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
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        isPrimary: false,
        isFavorite: false,
      };
      handleAddressSelect(currentLocationAddress);
    } else {
      // No location available, show message or handle accordingly
      console.log('No current location available');
    }
  }, [currentLocation, handleAddressSelect]);

  const handleAddNewAddress = useCallback(() => {
    setIsAddressModalVisible(false);
    navigation.navigate('EditLocationScreen');
  }, [navigation]);

  const handleGoFilter = useCallback(() => {
    navigation.navigate('FilterScreen');
  }, [navigation]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      navigation.navigate('ExploreScreen', {
        filters: {
          search: searchQuery.trim(),
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
      const salon = packageItem.salon || {
        id: packageItem.salon_id,
        name: packageItem.salon_name,
        image_url: packageItem.salon_image,
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

  // Initialize location permission check on mount
  useEffect(() => {
    // Check if we should show location permission modal
    const checkLocationPermission = async () => {
      try {
        // Check if location permission is already granted
        if (Platform.OS === 'ios') {
          // For iOS, we'll show the modal and let the user decide
          setShowLocationPermissionModal(true);
        } else {
          // For Android, check current permission status
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (!granted && !hasRequestedLocationPermission) {
            setShowLocationPermissionModal(true);
          }
          // Don't automatically get location even if permission is granted
          // User must explicitly allow through the modal
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
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
          // Get address from coordinates
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${currentLocation.lat},${currentLocation.lng}&key=${GOOGLE_MAPS_API_KEY}`,
          );
          const geocodeData = await geocodeResponse.json();

          if (geocodeData.results && geocodeData.results[0]) {
            await createAddress({
              description: geocodeData.results[0].formatted_address,
              is_favorite: false,
              latitude: currentLocation.lat.toString(),
              longitude: currentLocation.lng.toString(),
            });
            // Refetch addresses to get the new one
            refetchAddresses();
          }
        } catch (error) {
          console.error('Error creating address from current location:', error);
        }
      }
    };

    handleNoAddresses();
  }, [userAddresses.length, currentLocation, createAddress, refetchAddresses]);

  // Transform nearby salons for display
  const mappedSalons = useMemo(() => {
    return nearbySalons.map((salon: any): MappedSalon => {
      const distanceText =
        salon.distance < 1
          ? `${Math.round(salon.distance * 1000)}m`
          : `${salon.distance.toFixed(1)} km`;

      return {
        id: salon.id.toString(),
        title: salon.name,
        image: salon.image_url
          ? {uri: salon.image_url}
          : require('../../../assets/images/alia-ahmad.png'),
        distance: distanceText,
        time: salon.travelTime || undefined,
        rating: salon.average_rating || '0.0',
      };
    });
  }, [nearbySalons]);

  console.log('Loading states:', {
    packagesLoading,
    categoriesLoading,
    addressesLoading,
    nearbySalonsLoading,
    isLoadingAny,
  });

  // src/constants/images.js
  const itemImages = [
    require('../../../assets/images/br1.jpg'),
    require('../../../assets/images/br2.jpg'),
    require('../../../assets/images/br3.jpg'),
  ];
  const getImageForPackage = (id: number): any => {
    const index = id % itemImages.length;
    return itemImages[index];
  };

  // Loading skeleton for packages
  const PackageSkeleton = () => (
    <View style={styles.packageContainer}>
      <View style={styles.packageCard}>
        <View style={styles.packageImageContainer}>
          <View style={styles.skeletonImage} />
          <View style={styles.packageContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonPrice} />
            <View style={styles.skeletonDetails} />
          </View>
        </View>
      </View>
    </View>
  );

  const packageImagesRef = useRef<Record<number, any>>({});

  useEffect(() => {
    const map: Record<number, any> = {};
    packages.forEach((pkg, index) => {
      map[pkg.id] = itemImages[index % itemImages.length];
    });
    packageImagesRef.current = map;
  }, [packages]);
  // Memoized PackageItem component for better performance
  const PackageItem = React.memo(({package: pkg}: {package: Package}) => {
    const image = useMemo(() => getImageForPackage(pkg.id), [pkg.id]);

    const handlePress = useCallback(() => {
      handlePackagePress(pkg);
    }, [pkg, handlePackagePress]);

    const handleImageError = useCallback(() => {
      console.log('Image failed to load for package:', pkg.id);
    }, [pkg.id]);

    return (
      <View style={[styles.packageContainer ]}>
        <View
          style={styles.packageCard}>
          <View style={styles.packageImageContainer}>
            <Image
              source={image}
              style={styles.packageImage}
              resizeMode="cover"
              fadeDuration={300}
              onError={handleImageError}
              progressiveRenderingEnabled={true}
            />

            {/* Gradient Overlay */}
            <View style={styles.packageGradient} />

            {/* Discount Badge - Removed OFF and Price Labels */}
            {/* {pkg.discount_percentage > 0 && ( */}
            {/* <View style={styles.badgesContainer}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {pkg.discount_percentage}% OFF
                </Text>
              </View>
              <View style={styles.packagePrice}>
                <Text style={styles.priceText}>
                  {pkg.amount} {t.home.currency}
                </Text>
              </View>
            </View> */}
            {/* )} */}

            {/* Content */}
            <View style={styles.packageContent}>
              <View style={styles.packageHeader}>
                <Text style={styles.packageTitle} numberOfLines={2}>
                  {pkg.name}
                </Text>
              </View>

              <View style={styles.packageDetails}>
                <View style={styles.detailItem}>
                  <Icon name="time-outline" size={14} color={Colors.black} />
                  <Text style={styles.detailText}>
                    {pkg.time} {t.home.min}
                  </Text>
                </View>

                {pkg.description && (
                  <View style={styles.detailItem}>
                    <Icon
                      name="information-circle-outline"
                      size={14}
                      color={Colors.black}
                    />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {pkg.description}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Button - Hidden */}
              {/* <View style={styles.packageAction}>
                <View style={styles.actionButton}>
                  <Text style={styles.actionText}>{t.home.viewDetails}</Text>
                  <Icon name="chevron-forward" size={16} color={Colors.black} />
                </View>
              </View> */}
            </View>
          </View>
        </View>
      </View>
    );
  });

  const SearchBar = useCallback(
    () => {
      console.log('SearchBar render - search_here translation:', t.home.search_here);
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
    },
    [handleGoSearch, handleGoFilter, t.home.search_here],
  );

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
            selectedAddress={selectedAddress}
            handleSelected={handleAddressSelect}
            setCurrentLocation={handleCurrentLocationSelect}
            addNewAddress={handleAddNewAddress}
            addresses={userAddresses}
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
      navigation.navigate('ExploreScreen', {
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

                <TouchableOpacity
                  style={styles.notificationIconContainer}
                  onPress={() => navigation.navigate('NotificationsScreen')}>
                  <Icon name="notifications" size={20} color={Colors.black} />
                </TouchableOpacity>
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
                {packagesLoading ? (
                  <FlatList
                    data={[1, 2, 3]} // Show 3 skeleton items
                    keyExtractor={item => `skeleton-${item}`}
                    renderItem={() => <PackageSkeleton />}
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
                ) : packages.length > 0 ? (
                  <FlatList
                    data={packages}
                    contentContainerStyle={{paddingHorizontal: 4}}
                    keyExtractor={item => `package-${item.id}`}
                    renderItem={({item}) => <PackageItem package={item} />}
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
                  <Text style={styles.serviceTitle}>
                    {t.home.noCategoriesAvailable}
                  </Text>
                )}
                {/* </ScrollView> */}
              </View>
              {/* categories */}

              <View style={[styles.sectionSpacing2 , {marginTop: 20}]}>
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
                        onPress={() => handleCategoryPress(category.id, category.name)}>
                        <Image
                          source={
                            category.image_url
                              ? {uri: category.image_url}
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

              <View style={[styles.sectionSpacing2 , {marginTop: 20}]}>
                <BeautyServicesSection
                  title={t.home.nearbySalons}
                  data={mappedSalons.slice(0, 4)}
                  onItemPress={handleSalonPress}
                  onViewAllPress={handleViewAllPress}
                />
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
      <Footer />
      
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
